import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackCreditSegmentView, toFallbackCreditSegmentViews } from "./fallback-credit-segment-view.js";
import { newFallbackCreditSegment } from "./fallback-credit-segment.js";

test("FallbackCreditSegmentView shows the status in capitals", () => {
  const item = newFallbackCreditSegment("code-913", "label-377");
  const view = toFallbackCreditSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackCreditSegmentViews([item, item]).length, 2, "views");
});
