import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyRewardRuleCycleStore } from "./legacy-reward-rule-cycle-store.js";
import { newLegacyRewardRuleCycle } from "./legacy-reward-rule-cycle.js";

test("MemoryLegacyRewardRuleCycleStore finds what it saved", () => {
  const store = newMemoryLegacyRewardRuleCycleStore();
  const item = newLegacyRewardRuleCycle("code-551", "name-709");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
