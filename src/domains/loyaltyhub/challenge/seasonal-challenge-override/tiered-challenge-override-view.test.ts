import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredChallengeOverrideView, toTieredChallengeOverrideViews } from "./tiered-challenge-override-view.js";
import { newTieredChallengeOverride } from "./tiered-challenge-override.js";

test("TieredChallengeOverrideView shows the status in capitals", () => {
  const item = newTieredChallengeOverride("code-249", "title-152");
  const view = toTieredChallengeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredChallengeOverrideViews([item, item]).length, 2, "views");
});
