import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeRollupView, toChallengeRollupViews } from "./challenge-rollup-view.js";
import { newChallengeRollup } from "./challenge-rollup.js";

test("ChallengeRollupView shows the status in capitals", () => {
  const item = newChallengeRollup("code-121", "name-509");
  const view = toChallengeRollupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeRollupViews([item, item]).length, 2, "views");
});
