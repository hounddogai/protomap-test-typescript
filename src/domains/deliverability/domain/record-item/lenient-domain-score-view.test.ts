import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientDomainScoreView, toLenientDomainScoreViews } from "./lenient-domain-score-view.js";
import { newLenientDomainScore } from "./lenient-domain-score.js";

test("LenientDomainScoreView shows the status in capitals", () => {
  const item = newLenientDomainScore("code-208", "label-987");
  const view = toLenientDomainScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientDomainScoreViews([item, item]).length, 2, "views");
});
