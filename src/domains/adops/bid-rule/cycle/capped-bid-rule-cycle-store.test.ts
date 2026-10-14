import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBidRuleCycleStore } from "./capped-bid-rule-cycle-store.js";
import { newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

test("MemoryCappedBidRuleCycleStore finds what it saved", () => {
  const store = newMemoryCappedBidRuleCycleStore();
  const item = newCappedBidRuleCycle("code-586", "name-650");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
