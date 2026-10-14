import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedMentionBaselineView, toCappedMentionBaselineViews } from "./capped-mention-baseline-view.js";
import { newCappedMentionBaseline } from "./capped-mention-baseline.js";

test("CappedMentionBaselineView shows the status in capitals", () => {
  const item = newCappedMentionBaseline("code-621", "title-818");
  const view = toCappedMentionBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedMentionBaselineViews([item, item]).length, 2, "views");
});
