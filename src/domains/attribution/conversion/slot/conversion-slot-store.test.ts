import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionSlotStore } from "./conversion-slot-store.js";
import { newConversionSlot } from "./conversion-slot.js";

test("MemoryConversionSlotStore finds what it saved", () => {
  const store = newMemoryConversionSlotStore();
  const item = newConversionSlot("code-653", "title-920");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
