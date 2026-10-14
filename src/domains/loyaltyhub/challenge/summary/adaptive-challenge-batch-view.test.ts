import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveChallengeBatchView, toAdaptiveChallengeBatchViews } from "./adaptive-challenge-batch-view.js";
import { newAdaptiveChallengeBatch } from "./adaptive-challenge-batch.js";

test("AdaptiveChallengeBatchView shows the status in capitals", () => {
  const item = newAdaptiveChallengeBatch("code-277", "label-725");
  const view = toAdaptiveChallengeBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveChallengeBatchViews([item, item]).length, 2, "views");
});
