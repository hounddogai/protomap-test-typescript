import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutScoreView, toOptOutScoreViews } from "./opt-out-score-view.js";
import { newOptOutScore } from "./opt-out-score.js";

test("OptOutScoreView shows the status in capitals", () => {
  const item = newOptOutScore("code-237", "name-316");
  const view = toOptOutScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutScoreViews([item, item]).length, 2, "views");
});
