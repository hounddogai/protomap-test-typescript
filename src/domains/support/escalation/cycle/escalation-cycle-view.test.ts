import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationCycleView, toEscalationCycleViews } from "./escalation-cycle-view.js";
import { newEscalationCycle } from "./escalation-cycle.js";

test("EscalationCycleView shows the status in capitals", () => {
  const item = newEscalationCycle("code-522", "label-472");
  const view = toEscalationCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationCycleViews([item, item]).length, 2, "views");
});
