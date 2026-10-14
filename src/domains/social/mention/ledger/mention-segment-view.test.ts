import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionSegmentView, toMentionSegmentViews } from "./mention-segment-view.js";
import { newMentionSegment } from "./mention-segment.js";

test("MentionSegmentView shows the status in capitals", () => {
  const item = newMentionSegment("code-653", "label-526");
  const view = toMentionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionSegmentViews([item, item]).length, 2, "views");
});
