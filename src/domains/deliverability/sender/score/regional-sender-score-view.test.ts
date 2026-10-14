import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSenderScoreView, toRegionalSenderScoreViews } from "./regional-sender-score-view.js";
import { newRegionalSenderScore } from "./regional-sender-score.js";

test("RegionalSenderScoreView shows the status in capitals", () => {
  const item = newRegionalSenderScore("code-175", "name-811");
  const view = toRegionalSenderScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSenderScoreViews([item, item]).length, 2, "views");
});
