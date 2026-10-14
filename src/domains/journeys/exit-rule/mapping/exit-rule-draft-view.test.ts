import assert from "node:assert/strict";
import { test } from "node:test";
import { toExitRuleDraftView, toExitRuleDraftViews } from "./exit-rule-draft-view.js";
import { newExitRuleDraft } from "./exit-rule-draft.js";

test("ExitRuleDraftView shows the status in capitals", () => {
  const item = newExitRuleDraft("code-3", "title-118");
  const view = toExitRuleDraftView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toExitRuleDraftViews([item, item]).length, 2, "views");
});
