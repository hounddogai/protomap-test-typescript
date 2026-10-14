import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditSegmentView, toCreditSegmentViews } from "./credit-segment-view.js";
import { newCreditSegment } from "./credit-segment.js";

test("CreditSegmentView shows the status in capitals", () => {
  const item = newCreditSegment("code-553", "title-428");
  const view = toCreditSegmentView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditSegmentViews([item, item]).length, 2, "views");
});
