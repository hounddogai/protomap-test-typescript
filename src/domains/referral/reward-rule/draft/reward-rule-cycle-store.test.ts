import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleCycleStore } from "./reward-rule-cycle-store.js";
import { newRewardRuleCycle } from "./reward-rule-cycle.js";

test("MemoryRewardRuleCycleStore finds what it saved", () => {
  const store = newMemoryRewardRuleCycleStore();
  const item = newRewardRuleCycle("code-605", "label-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
