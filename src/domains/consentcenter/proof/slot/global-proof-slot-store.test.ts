import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalProofSlotStore } from "./global-proof-slot-store.js";
import { newGlobalProofSlot } from "./global-proof-slot.js";

test("MemoryGlobalProofSlotStore finds what it saved", () => {
  const store = newMemoryGlobalProofSlotStore();
  const item = newGlobalProofSlot("code-956", "label-139");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
