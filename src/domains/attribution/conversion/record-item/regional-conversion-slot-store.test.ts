import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalConversionSlotStore } from "./regional-conversion-slot-store.js";
import { newRegionalConversionSlot } from "./regional-conversion-slot.js";

test("MemoryRegionalConversionSlotStore finds what it saved", () => {
  const store = newMemoryRegionalConversionSlotStore();
  const item = newRegionalConversionSlot("code-187", "title-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
