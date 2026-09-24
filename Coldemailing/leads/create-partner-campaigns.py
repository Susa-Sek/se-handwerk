#!/usr/bin/env python3
# Legt die 4 Partner-Kampagnen DB-only an (Warmbly-API tot). Klont die Settings einer
# bestehenden aktiven Kampagne (ICP1) - gleiche Org/Sender/Sendefenster - setzt aber
# status='draft', kleines daily_limit + mnl>0 (Partnerkanal MUSS Erstmails senden).
# Sequenzen aus sequences-partner.json. Idempotent: campaigns ON CONFLICT DO NOTHING,
# sequences werden je Kampagne ersetzt (DELETE+INSERT), senders ON CONFLICT DO NOTHING.
#   python create-partner-campaigns.py            (dry-run: zeigt SQL)
#   python create-partner-campaigns.py --apply
import json, os, sys, subprocess, html

HERE = os.path.dirname(os.path.abspath(__file__))
PG = ["docker", "exec", "-i", "warmbly-postgres-1", "psql", "-U", "warmbly", "-d", "warmbly_dev"]
APPLY = "--apply" in sys.argv

# Aus der Live-DB geklont (ICP1 65d59308...):
ORG_ID = "43938660-3b2e-43bd-af34-70663af28201"
USER_ID = "c9fe81fa-8c10-4b58-b12e-b6e3882772f7"
SENDERS = [  # die 3 se-handwerk.work-Postfaecher
    "6a8bf3da-1974-4ae2-9b32-fe9c739d8b04",  # info@
    "43ad9d8c-c429-4aeb-bce2-7f80aa4e0f73",  # hi@
    "3bbc6f55-c290-4ed2-9227-1f107910803e",  # team@
]
# Test-Settings: klein + Draft. daily_limit 5/Kampagne, mnl 5 (Erstmails erlaubt, gedrosselt).
DAILY_LIMIT = 5
MNL = 5


def q(s):
    return "'" + s.replace("'", "''") + "'"


def to_html(txt):
    paras = txt.split("\n\n")
    return "".join(
        "<p>" + "<br>".join(html.escape(l) for l in p.split("\n")) + "</p>"
        for p in paras if p.strip()
    )


def main():
    data = json.load(open(os.path.join(HERE, "sequences-partner.json"), encoding="utf-8"))
    sql = ["BEGIN;"]
    for camp in data["campaigns"]:
        cid = camp["campaign_id"]
        name = camp["campaign_name"]
        desc = f"Partner-/Empfehlungskanal {camp['gewerk']} - reziproke Empfehlung + Nachunternehmer (Test)"
        sql.append(
            "INSERT INTO campaigns (id, user_id, organization_id, name, description, status, "
            "stop_on_reply, open_tracking, link_tracking, text_only, daily_limit, unsubscribe_header, "
            "risky_emails, timezone, days, start_time, end_time, sender_strategy, rotation_mode, "
            "esp_match_mode, max_new_leads_per_day, prioritize_new_leads, created_at, updated_at) VALUES ("
            f"{q(cid)}, {q(USER_ID)}, {q(ORG_ID)}, {q(name)}, {q(desc)}, 'draft', "
            "true, false, false, true, "
            f"{DAILY_LIMIT}, true, true, 'Europe/Berlin', 63, '08:00', '16:00', 'tags', 'weighted', "
            f"'off', {MNL}, false, now(), now()) ON CONFLICT (id) DO NOTHING;"
        )
        for i, acc in enumerate(SENDERS):
            sql.append(
                "INSERT INTO campaign_senders (campaign_id, email_account_id, weight, "
                "rotation_position, enabled, created_at) VALUES ("
                f"{q(cid)}, {q(acc)}, 1, {i}, true, now()) ON CONFLICT DO NOTHING;"
            )
        # Sequenzen: sauber ersetzen (Draft, noch kein Versand) -> idempotent bei Copy-Aenderung
        sql.append(f"DELETE FROM sequences WHERE campaign_id={q(cid)};")
        for st in camp["steps"]:
            body = st["body_plain"]
            sql.append(
                "INSERT INTO sequences (id, campaign_id, organization_id, name, subject, "
                "body_plain, body_html, body_sync, body_code, wait_after, position, kind, "
                "conditions, action, created_at, updated_at) VALUES (gen_random_uuid(), "
                f"{q(cid)}, {q(ORG_ID)}, {q('Schritt ' + str(st['position']))}, {q(st['subject'])}, "
                f"{q(body)}, {q(to_html(body))}, true, false, {int(st['wait_after'])}, "
                f"{int(st['position'])}, 'email', '{{}}'::jsonb, '{{}}'::jsonb, now(), now());"
            )
    sql.append("COMMIT;")
    full = "\n".join(sql)

    if not APPLY:
        print(full)
        print(f"\n(dry-run - {len(data['campaigns'])} Kampagnen x 4 Steps + je 3 Sender. Mit --apply schreiben.)")
        return
    r = subprocess.run(PG, input=full, capture_output=True, text=True, encoding="utf-8")
    print((r.stdout + r.stderr).strip()[-1500:])


if __name__ == "__main__":
    main()
