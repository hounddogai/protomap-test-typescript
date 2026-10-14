import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveExitRuleDraftView, toAdaptiveExitRuleDraftViews } from "./adaptive-exit-rule-draft-view.js";
import { newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("AdaptiveExitRuleDraftView shows the status in capitals", () => {
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  const view = toAdaptiveExitRuleDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveExitRuleDraftViews([item, item]).length, 2, "views");
});
