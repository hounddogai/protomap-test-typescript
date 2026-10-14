import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleCycleStore } from "./bid-rule-cycle-store.js";
import { newBidRuleCycle } from "./bid-rule-cycle.js";

test("MemoryBidRuleCycleStore finds what it saved", () => {
  const store = newMemoryBidRuleCycleStore();
  const item = newBidRuleCycle("code-980", "label-495");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
