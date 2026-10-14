import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationOverrideView, toEscalationOverrideViews } from "./escalation-override-view.js";
import { newEscalationOverride } from "./escalation-override.js";

test("EscalationOverrideView shows the status in capitals", () => {
  const item = newEscalationOverride("code-795", "name-784");
  const view = toEscalationOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationOverrideViews([item, item]).length, 2, "views");
});
