import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualChallengeBatchView, toManualChallengeBatchViews } from "./manual-challenge-batch-view.js";
import { newManualChallengeBatch } from "./manual-challenge-batch.js";

test("ManualChallengeBatchView shows the status in capitals", () => {
  const item = newManualChallengeBatch("code-674", "title-615");
  const view = toManualChallengeBatchView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualChallengeBatchViews([item, item]).length, 2, "views");
});
