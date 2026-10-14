import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleRequestStore } from "./bid-rule-request-store.js";
import { newBidRuleRequest } from "./bid-rule-request.js";

test("MemoryBidRuleRequestStore finds what it saved", () => {
  const store = newMemoryBidRuleRequestStore();
  const item = newBidRuleRequest("code-308", "label-548");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
