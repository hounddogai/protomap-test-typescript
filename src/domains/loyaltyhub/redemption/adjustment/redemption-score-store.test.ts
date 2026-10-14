import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionScoreStore } from "./redemption-score-store.js";
import { newRedemptionScore } from "./redemption-score.js";

test("MemoryRedemptionScoreStore finds what it saved", () => {
  const store = newMemoryRedemptionScoreStore();
  const item = newRedemptionScore("code-242", "title-97");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
