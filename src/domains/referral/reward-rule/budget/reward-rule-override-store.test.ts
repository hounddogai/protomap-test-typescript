import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleOverrideStore } from "./reward-rule-override-store.js";
import { newRewardRuleOverride } from "./reward-rule-override.js";

test("MemoryRewardRuleOverrideStore finds what it saved", () => {
  const store = newMemoryRewardRuleOverrideStore();
  const item = newRewardRuleOverride("code-576", "title-536");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
