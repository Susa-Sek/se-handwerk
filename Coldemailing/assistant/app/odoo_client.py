"""Odoo-CRM-Zugriff via XML-RPC (aus leads/odoo-sync.py portiert). Lesen + gezielte Writes."""
import xmlrpc.client, datetime
from . import config

class Odoo:
    def __init__(self):
        url = config.require("ODOO_URL")
        self.db = config.require("ODOO_DB")
        self.pw = config.require("ODOO_API_KEY")
        login = config.require("ODOO_LOGIN")
        common = xmlrpc.client.ServerProxy(url + "/xmlrpc/2/common", allow_none=True)
        self.uid = common.authenticate(self.db, login, self.pw, {})
        if not self.uid:
            raise RuntimeError("Odoo-Login fehlgeschlagen")
        self.models = xmlrpc.client.ServerProxy(url + "/xmlrpc/2/object", allow_none=True)
        r = self.search("res.users", [("login", "=", config.ODOO_OWNER_LOGIN)])
        self.owner_uid = r[0] if r else self.uid
        self.lead_model_id = self.search("ir.model", [("model", "=", "crm.lead")])[0]

    def _call(self, model, method, args, kw=None):
        return self.models.execute_kw(self.db, self.uid, self.pw, model, method, args, kw or {})

    def search(self, model, dom, **kw):
        return self._call(model, "search", [dom], kw)

    def search_read(self, model, dom, fields, **kw):
        return self._call(model, "search_read", [dom], dict(fields=fields, **kw))

    def write(self, model, ids, vals):
        return self._call(model, "write", [ids, vals])

    # ---------------- READ ----------------
    def find_leads(self, query="", email="", limit=8):
        dom = []
        if email:
            dom = [("email_from", "ilike", email)]
        elif query:
            dom = ["|", "|", ("partner_name", "ilike", query),
                   ("name", "ilike", query), ("email_from", "ilike", query)]
        rows = self.search_read("crm.lead", dom,
            ["id", "name", "email_from", "phone", "stage_id",
             "x_warmbly_campaign", "x_warmbly_step", "x_warmbly_verification"],
            limit=limit, order="write_date desc")
        return rows

    def lead_detail(self, lead_id):
        r = self.search_read("crm.lead", [("id", "=", lead_id)],
            ["name", "email_from", "phone", "city", "stage_id", "active",
             "x_warmbly_campaign", "x_warmbly_step", "description"],
            limit=1, context={"active_test": False})
        if not r:
            return None
        lead = r[0]
        acts = self.search_read("mail.activity",
            [("res_model", "=", "crm.lead"), ("res_id", "=", lead_id)],
            ["activity_type_id", "summary", "date_deadline"])
        lead["activities"] = acts
        return lead

    def list_activities(self, only_type="", overdue_only=False):
        dom = [("user_id", "=", self.owner_uid), ("res_model", "=", "crm.lead")]
        if only_type:
            dom.append(("activity_type_id.name", "=", only_type))
        if overdue_only:
            dom.append(("date_deadline", "<=", datetime.date.today().isoformat()))
        rows = self.search_read("mail.activity", dom,
            ["activity_type_id", "summary", "date_deadline", "res_id"],
            order="date_deadline")
        # Lead-Namen anreichern
        ids = list({r["res_id"] for r in rows})
        names = {l["id"]: l["name"] for l in
                 self.search_read("crm.lead", [("id", "in", ids)], ["name"],
                                  context={"active_test": False})} if ids else {}
        for r in rows:
            r["lead_name"] = names.get(r["res_id"], "?")
        return rows

    def list_tasks(self, project="", open_only=True):
        dom = []
        if project:
            dom.append(("project_id.name", "=", project))
        if open_only:
            dom.append(("stage_id.fold", "=", False))
        return self.search_read("project.task", dom,
            ["name", "stage_id", "project_id", "date_deadline"], order="priority desc", limit=50)

    # ---------------- WRITE (nur nach Bestaetigung) ----------------
    def post_note(self, lead_id, text, is_html=False):
        import html as _h
        body = text if is_html else "<p>" + _h.escape(text).replace("\n", "<br/>") + "</p>"
        return self._call("crm.lead", "message_post", [[lead_id]],
            {"body": body, "message_type": "comment",
             "subtype_xmlid": "mail.mt_note", "body_is_html": True})

    def create_nachfass(self, lead_id, days=3, summary="Nachfassen"):
        atype = self.search("mail.activity.type", [("name", "=", "Nachfassen")])
        if not atype:
            atype = [self._call("mail.activity.type", "create",
                     [{"name": "Nachfassen", "delay_count": 3, "delay_unit": "days"}])]
        # Dedup: schon offene Nachfass-Aktivitaet?
        exists = self._call("mail.activity", "search_count",
            [[("res_model", "=", "crm.lead"), ("res_id", "=", lead_id),
              ("activity_type_id", "=", atype[0])]])
        if exists:
            return "schon vorhanden"
        due = (datetime.date.today() + datetime.timedelta(days=days)).isoformat()
        return self._call("mail.activity", "create", [{
            "res_model_id": self.lead_model_id, "res_id": lead_id,
            "activity_type_id": atype[0], "summary": summary,
            "date_deadline": due, "user_id": self.owner_uid}])

    def complete_open_activities(self, lead_id, type_name="Antworten"):
        atype = self.search("mail.activity.type", [("name", "=", type_name)])
        if not atype:
            return 0
        acts = self.search("mail.activity",
            [("res_model", "=", "crm.lead"), ("res_id", "=", lead_id),
             ("activity_type_id", "=", atype[0])])
        for a in acts:
            try:
                self._call("mail.activity", "action_feedback", [[a]], {"feedback": "Erledigt (Assistent)"})
            except Exception:
                self._call("mail.activity", "unlink", [[a]])
        return len(acts)

    def move_stage(self, lead_id, stage_name):
        st = self.search("crm.stage", [("name", "=", stage_name)])
        if not st:
            return False
        self.write("crm.lead", [lead_id], {"stage_id": st[0]})
        return True
