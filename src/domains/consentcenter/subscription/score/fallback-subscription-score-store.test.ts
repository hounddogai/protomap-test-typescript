import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSubscriptionScoreStore } from "./fallback-subscription-score-store.js";
import { newFallbackSubscriptionScore } from "./fallback-subscription-score.js";

test("MemoryFallbackSubscriptionScoreStore finds what it saved", () => {
  const store = newMemoryFallbackSubscriptionScoreStore();
  const item = newFallbackSubscriptionScore("code-301", "label-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
