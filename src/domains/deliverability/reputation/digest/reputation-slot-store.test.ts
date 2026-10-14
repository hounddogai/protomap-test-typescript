import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationSlotStore } from "./reputation-slot-store.js";
import { newReputationSlot } from "./reputation-slot.js";

test("MemoryReputationSlotStore finds what it saved", () => {
  const store = newMemoryReputationSlotStore();
  const item = newReputationSlot("code-750", "title-173");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
