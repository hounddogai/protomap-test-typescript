import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationRollupView, toEscalationRollupViews } from "./escalation-rollup-view.js";
import { newEscalationRollup } from "./escalation-rollup.js";

test("EscalationRollupView shows the status in capitals", () => {
  const item = newEscalationRollup("code-513", "name-897");
  const view = toEscalationRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationRollupViews([item, item]).length, 2, "views");
});
