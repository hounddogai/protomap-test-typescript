import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualExitRuleDraftView, toManualExitRuleDraftViews } from "./manual-exit-rule-draft-view.js";
import { newManualExitRuleDraft } from "./manual-exit-rule-draft.js";

test("ManualExitRuleDraftView shows the status in capitals", () => {
  const item = newManualExitRuleDraft("code-664", "title-720");
  const view = toManualExitRuleDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualExitRuleDraftViews([item, item]).length, 2, "views");
});
