import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictConversionSlotStore } from "./strict-conversion-slot-store.js";
import { newStrictConversionSlot } from "./strict-conversion-slot.js";

test("MemoryStrictConversionSlotStore finds what it saved", () => {
  const store = newMemoryStrictConversionSlotStore();
  const item = newStrictConversionSlot("code-824", "title-621");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
