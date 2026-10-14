import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualDomainScoreView, toManualDomainScoreViews } from "./manual-domain-score-view.js";
import { newManualDomainScore } from "./manual-domain-score.js";

test("ManualDomainScoreView shows the status in capitals", () => {
  const item = newManualDomainScore("code-723", "title-748");
  const view = toManualDomainScoreView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualDomainScoreViews([item, item]).length, 2, "views");
});
