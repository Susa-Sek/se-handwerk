"""Warmbly-Postgres — STRIKT READ-ONLY (psycopg, host:15432). Aus leads/status.py portiert."""
import psycopg
from . import config

def _conn():
    return psycopg.connect(
        host=config.get("WARMBLY_PG_HOST", "localhost"),
        port=int(config.get("WARMBLY_PG_PORT", "15432")),
        user=config.get("WARMBLY_PG_USER", "warmbly"),
        password=config.get("WARMBLY_PG_PASSWORD", "warmbly"),
        dbname=config.get("WARMBLY_PG_DB", "warmbly_dev"),
        connect_timeout=10, autocommit=True)

def campaign_status(name_filter=""):
    """Kampagnen: Leads / Gesendet / Antworten / Bounces / letzter Send."""
    where = "c.status <> 'draft'"
    params = []
    if name_filter:
        where += " AND c.name ILIKE %s"
        params.append(f"%{name_filter}%")
    q = f"""
      SELECT c.name, c.status,
        (SELECT count(*) FROM campaign_leads cl WHERE cl.campaign_id=c.id),
        (SELECT count(*) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.sent_at IS NOT NULL),
        (SELECT count(*) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.replied_at IS NOT NULL),
        (SELECT count(*) FROM campaign_contact_progress p WHERE p.campaign_id=c.id AND p.bounced_at IS NOT NULL),
        (SELECT to_char(max(p.sent_at) AT TIME ZONE 'Europe/Berlin','DD.MM. HH24:MI')
           FROM campaign_contact_progress p WHERE p.campaign_id=c.id)
      FROM campaigns c WHERE {where} ORDER BY c.status DESC, c.name"""
    with _conn() as con, con.cursor() as cur:
        cur.execute(q, params)
        rows = cur.fetchall()
        cur.execute("""SELECT to_char(min(scheduled_at) AT TIME ZONE 'Europe/Berlin','DD.MM. HH24:MI')
                       FROM tasks WHERE task_type='campaign' AND status='pending' AND scheduled_at > now()""")
        nxt = cur.fetchone()[0]
    return {
        "campaigns": [dict(name=r[0], status=r[1], leads=r[2], sent=r[3],
                           replies=r[4], bounces=r[5], last_sent=r[6]) for r in rows],
        "next_send": nxt,
    }

def recent_replies(limit=8):
    q = """SELECT to_char(p.replied_at AT TIME ZONE 'Europe/Berlin','DD.MM HH24:MI'),
                  coalesce(nullif(co.company,''), co.email), co.email
           FROM campaign_contact_progress p JOIN contacts co ON co.id=p.contact_id
           WHERE p.replied_at IS NOT NULL ORDER BY p.replied_at DESC LIMIT %s"""
    with _conn() as con, con.cursor() as cur:
        cur.execute(q, [limit])
        return [dict(when=r[0], company=r[1], email=r[2]) for r in cur.fetchall()]

def contact_by_email(email):
    q = """SELECT id, coalesce(nullif(company,''), email), email, phone, verification_status
           FROM contacts WHERE organization_id=%s AND lower(email)=lower(%s) LIMIT 1"""
    with _conn() as con, con.cursor() as cur:
        cur.execute(q, [config.WARMBLY_ORG, email])
        r = cur.fetchone()
    return dict(id=str(r[0]), company=r[1], email=r[2], phone=r[3], verification=r[4]) if r else None
