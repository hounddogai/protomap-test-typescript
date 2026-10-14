import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedProofRuleStore } from "./capped-proof-rule-store.js";
import { newCappedProofRule } from "./capped-proof-rule.js";

test("MemoryCappedProofRuleStore finds what it saved", () => {
  const store = newMemoryCappedProofRuleStore();
  const item = newCappedProofRule("code-487", "label-334");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
