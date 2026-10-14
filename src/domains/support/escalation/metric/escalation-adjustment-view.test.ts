import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationAdjustmentView, toEscalationAdjustmentViews } from "./escalation-adjustment-view.js";
import { newEscalationAdjustment } from "./escalation-adjustment.js";

test("EscalationAdjustmentView shows the status in capitals", () => {
  const item = newEscalationAdjustment("code-998", "name-478");
  const view = toEscalationAdjustmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationAdjustmentViews([item, item]).length, 2, "views");
});
