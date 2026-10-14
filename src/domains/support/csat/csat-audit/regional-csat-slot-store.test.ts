import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCsatSlotStore } from "./regional-csat-slot-store.js";
import { newRegionalCsatSlot } from "./regional-csat-slot.js";

test("MemoryRegionalCsatSlotStore finds what it saved", () => {
  const store = newMemoryRegionalCsatSlotStore();
  const item = newRegionalCsatSlot("code-877", "title-399");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
