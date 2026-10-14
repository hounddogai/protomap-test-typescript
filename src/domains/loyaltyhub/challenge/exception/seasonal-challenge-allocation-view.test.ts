import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toSeasonalChallengeAllocationView,
  toSeasonalChallengeAllocationViews,
} from "./seasonal-challenge-allocation-view.js";
import { newSeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

test("SeasonalChallengeAllocationView shows the status in capitals", () => {
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  const view = toSeasonalChallengeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalChallengeAllocationViews([item, item]).length, 2, "views");
});
