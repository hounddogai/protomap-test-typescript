import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeRuleStore } from "./challenge-rule-store.js";
import { newChallengeRule } from "./challenge-rule.js";

test("MemoryChallengeRuleStore finds what it saved", () => {
  const store = newMemoryChallengeRuleStore();
  const item = newChallengeRule("code-939", "label-337");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
