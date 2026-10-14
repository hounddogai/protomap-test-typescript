import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyChallengeTargetView, toLegacyChallengeTargetViews } from "./legacy-challenge-target-view.js";
import { newLegacyChallengeTarget } from "./legacy-challenge-target.js";

test("LegacyChallengeTargetView shows the status in capitals", () => {
  const item = newLegacyChallengeTarget("code-96", "title-508");
  const view = toLegacyChallengeTargetView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyChallengeTargetViews([item, item]).length, 2, "views");
});
