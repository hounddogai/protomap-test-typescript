import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalDoubleOptInSlotStore } from "./seasonal-double-opt-in-slot-store.js";
import { newSeasonalDoubleOptInSlot } from "./seasonal-double-opt-in-slot.js";

test("MemorySeasonalDoubleOptInSlotStore finds what it saved", () => {
  const store = newMemorySeasonalDoubleOptInSlotStore();
  const item = newSeasonalDoubleOptInSlot("code-758", "name-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
