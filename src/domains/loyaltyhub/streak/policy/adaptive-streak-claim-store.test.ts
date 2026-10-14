import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveStreakClaimStore } from "./adaptive-streak-claim-store.js";
import { newAdaptiveStreakClaim } from "./adaptive-streak-claim.js";

test("MemoryAdaptiveStreakClaimStore finds what it saved", () => {
  const store = newMemoryAdaptiveStreakClaimStore();
  const item = newAdaptiveStreakClaim("code-401", "label-317");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
