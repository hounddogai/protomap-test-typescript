import assert from "node:assert/strict";
import { test } from "node:test";
import { toApprovalSegmentView, toApprovalSegmentViews } from "./approval-segment-view.js";
import { newApprovalSegment } from "./approval-segment.js";

test("ApprovalSegmentView shows the status in capitals", () => {
  const item = newApprovalSegment("code-203", "name-288");
  const view = toApprovalSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toApprovalSegmentViews([item, item]).length, 2, "views");
});
