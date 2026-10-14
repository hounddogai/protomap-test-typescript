import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeTargetView, toChallengeTargetViews } from "./challenge-target-view.js";
import { newChallengeTarget } from "./challenge-target.js";

test("ChallengeTargetView shows the status in capitals", () => {
  const item = newChallengeTarget("code-713", "name-237");
  const view = toChallengeTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeTargetViews([item, item]).length, 2, "views");
});
