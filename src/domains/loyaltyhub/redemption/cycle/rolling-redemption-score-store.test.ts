import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingRedemptionScoreStore } from "./rolling-redemption-score-store.js";
import { newRollingRedemptionScore } from "./rolling-redemption-score.js";

test("MemoryRollingRedemptionScoreStore finds what it saved", () => {
  const store = newMemoryRollingRedemptionScoreStore();
  const item = newRollingRedemptionScore("code-596", "title-471");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
