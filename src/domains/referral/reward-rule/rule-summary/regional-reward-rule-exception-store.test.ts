import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRewardRuleExceptionStore } from "./regional-reward-rule-exception-store.js";
import { newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

test("MemoryRegionalRewardRuleExceptionStore finds what it saved", () => {
  const store = newMemoryRegionalRewardRuleExceptionStore();
  const item = newRegionalRewardRuleException("code-108", "label-628");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
