import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCohortTemplateView, toPendingCohortTemplateViews } from "./pending-cohort-template-view.js";
import { newPendingCohortTemplate } from "./pending-cohort-template.js";

test("PendingCohortTemplateView shows the status in capitals", () => {
  const item = newPendingCohortTemplate("code-217", "name-653");
  const view = toPendingCohortTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCohortTemplateViews([item, item]).length, 2, "views");
});
