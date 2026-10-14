import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDeflectionSlotStore } from "./legacy-deflection-slot-store.js";
import { newLegacyDeflectionSlot } from "./legacy-deflection-slot.js";

test("MemoryLegacyDeflectionSlotStore finds what it saved", () => {
  const store = newMemoryLegacyDeflectionSlotStore();
  const item = newLegacyDeflectionSlot("code-353", "label-364");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
