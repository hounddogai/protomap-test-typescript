import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalConversionSlotStore } from "./seasonal-conversion-slot-store.js";
import { newSeasonalConversionSlot } from "./seasonal-conversion-slot.js";

test("MemorySeasonalConversionSlotStore finds what it saved", () => {
  const store = newMemorySeasonalConversionSlotStore();
  const item = newSeasonalConversionSlot("code-570", "name-869");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
