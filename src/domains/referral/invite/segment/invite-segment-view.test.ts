import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteSegmentView, toInviteSegmentViews } from "./invite-segment-view.js";
import { newInviteSegment } from "./invite-segment.js";

test("InviteSegmentView shows the status in capitals", () => {
  const item = newInviteSegment("code-710", "title-986");
  const view = toInviteSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteSegmentViews([item, item]).length, 2, "views");
});
