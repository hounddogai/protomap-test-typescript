import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleSlotStore } from "./bid-rule-slot-store.js";
import { newBidRuleSlot } from "./bid-rule-slot.js";

test("MemoryBidRuleSlotStore finds what it saved", () => {
  const store = newMemoryBidRuleSlotStore();
  const item = newBidRuleSlot("code-468", "label-456");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
