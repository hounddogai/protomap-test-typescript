import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneySlotStore } from "./rolling-journey-slot-store.js";
import { newRollingJourneySlot } from "./rolling-journey-slot.js";

test("MemoryRollingJourneySlotStore finds what it saved", () => {
  const store = newMemoryRollingJourneySlotStore();
  const item = newRollingJourneySlot("code-788", "label-858");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
