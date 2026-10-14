import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictBidRuleSlotStore } from "./strict-bid-rule-slot-store.js";
import { newStrictBidRuleSlot } from "./strict-bid-rule-slot.js";

test("MemoryStrictBidRuleSlotStore finds what it saved", () => {
  const store = newMemoryStrictBidRuleSlotStore();
  const item = newStrictBidRuleSlot("code-112", "title-882");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
