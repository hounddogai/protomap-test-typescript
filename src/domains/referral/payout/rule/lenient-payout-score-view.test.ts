import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientPayoutScoreView, toLenientPayoutScoreViews } from "./lenient-payout-score-view.js";
import { newLenientPayoutScore } from "./lenient-payout-score.js";

test("LenientPayoutScoreView shows the status in capitals", () => {
  const item = newLenientPayoutScore("code-595", "label-467");
  const view = toLenientPayoutScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientPayoutScoreViews([item, item]).length, 2, "views");
});
