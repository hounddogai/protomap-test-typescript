import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleTargetStore } from "./bid-rule-target-store.js";
import { newBidRuleTarget } from "./bid-rule-target.js";

test("MemoryBidRuleTargetStore finds what it saved", () => {
  const store = newMemoryBidRuleTargetStore();
  const item = newBidRuleTarget("code-924", "title-191");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
