import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleExceptionStore } from "./bid-rule-exception-store.js";
import { newBidRuleException } from "./bid-rule-exception.js";

test("MemoryBidRuleExceptionStore finds what it saved", () => {
  const store = newMemoryBidRuleExceptionStore();
  const item = newBidRuleException("code-774", "label-97");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
