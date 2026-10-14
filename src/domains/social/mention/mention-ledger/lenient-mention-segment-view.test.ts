import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientMentionSegmentView, toLenientMentionSegmentViews } from "./lenient-mention-segment-view.js";
import { newLenientMentionSegment } from "./lenient-mention-segment.js";

test("LenientMentionSegmentView shows the status in capitals", () => {
  const item = newLenientMentionSegment("code-94", "title-579");
  const view = toLenientMentionSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientMentionSegmentViews([item, item]).length, 2, "views");
});
