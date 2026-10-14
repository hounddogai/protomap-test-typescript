import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeAllocationView, toChallengeAllocationViews } from "./challenge-allocation-view.js";
import { newChallengeAllocation } from "./challenge-allocation.js";

test("ChallengeAllocationView shows the status in capitals", () => {
  const item = newChallengeAllocation("code-294", "title-766");
  const view = toChallengeAllocationView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeAllocationViews([item, item]).length, 2, "views");
});
