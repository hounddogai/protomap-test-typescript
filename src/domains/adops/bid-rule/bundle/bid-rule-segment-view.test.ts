import assert from "node:assert/strict";
import { test } from "node:test";
import { toBidRuleSegmentView, toBidRuleSegmentViews } from "./bid-rule-segment-view.js";
import { newBidRuleSegment } from "./bid-rule-segment.js";

test("BidRuleSegmentView shows the status in capitals", () => {
  const item = newBidRuleSegment("code-481", "label-255");
  const view = toBidRuleSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBidRuleSegmentViews([item, item]).length, 2, "views");
});
