import assert from "node:assert/strict";
import { test } from "node:test";
import { toQueueScoreView, toQueueScoreViews } from "./queue-score-view.js";
import { newQueueScore } from "./queue-score.js";

test("QueueScoreView shows the status in capitals", () => {
  const item = newQueueScore("code-676", "name-457");
  const view = toQueueScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toQueueScoreViews([item, item]).length, 2, "views");
});
