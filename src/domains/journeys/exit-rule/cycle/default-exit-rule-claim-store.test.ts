import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultExitRuleClaimStore } from "./default-exit-rule-claim-store.js";
import { newDefaultExitRuleClaim } from "./default-exit-rule-claim.js";

test("MemoryDefaultExitRuleClaimStore finds what it saved", () => {
  const store = newMemoryDefaultExitRuleClaimStore();
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
