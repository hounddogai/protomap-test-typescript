import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveDomainScoreView, toAdaptiveDomainScoreViews } from "./adaptive-domain-score-view.js";
import { newAdaptiveDomainScore } from "./adaptive-domain-score.js";

test("AdaptiveDomainScoreView shows the status in capitals", () => {
  const item = newAdaptiveDomainScore("code-362", "name-173");
  const view = toAdaptiveDomainScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveDomainScoreViews([item, item]).length, 2, "views");
});
