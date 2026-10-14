import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowScoreView, toWindowScoreViews } from "./window-score-view.js";
import { newWindowScore } from "./window-score.js";

test("WindowScoreView shows the status in capitals", () => {
  const item = newWindowScore("code-209", "label-955");
  const view = toWindowScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowScoreViews([item, item]).length, 2, "views");
});
