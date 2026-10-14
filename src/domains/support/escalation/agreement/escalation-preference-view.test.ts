import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationPreferenceView, toEscalationPreferenceViews } from "./escalation-preference-view.js";
import { newEscalationPreference } from "./escalation-preference.js";

test("EscalationPreferenceView shows the status in capitals", () => {
  const item = newEscalationPreference("code-150", "label-278");
  const view = toEscalationPreferenceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationPreferenceViews([item, item]).length, 2, "views");
});
