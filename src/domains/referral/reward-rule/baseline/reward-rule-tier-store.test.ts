import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleTierStore } from "./reward-rule-tier-store.js";
import { newRewardRuleTier } from "./reward-rule-tier.js";

test("MemoryRewardRuleTierStore finds what it saved", () => {
  const store = newMemoryRewardRuleTierStore();
  const item = newRewardRuleTier("code-354", "label-936");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
