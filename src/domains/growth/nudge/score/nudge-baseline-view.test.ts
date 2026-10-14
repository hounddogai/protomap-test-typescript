import assert from "node:assert/strict";
import { test } from "node:test";
import { toNudgeBaselineView, toNudgeBaselineViews } from "./nudge-baseline-view.js";
import { newNudgeBaseline } from "./nudge-baseline.js";

test("NudgeBaselineView shows the status in capitals", () => {
  const item = newNudgeBaseline("code-965", "title-988");
  const view = toNudgeBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toNudgeBaselineViews([item, item]).length, 2, "views");
});
