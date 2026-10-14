import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofSlotStore } from "./proof-slot-store.js";
import { newProofSlot } from "./proof-slot.js";

test("MemoryProofSlotStore finds what it saved", () => {
  const store = newMemoryProofSlotStore();
  const item = newProofSlot("code-373", "title-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
