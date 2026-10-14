import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeScoreView, toCreativeScoreViews } from "./creative-score-view.js";
import { newCreativeScore } from "./creative-score.js";

test("CreativeScoreView shows the status in capitals", () => {
  const item = newCreativeScore("code-644", "name-295");
  const view = toCreativeScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeScoreViews([item, item]).length, 2, "views");
});
