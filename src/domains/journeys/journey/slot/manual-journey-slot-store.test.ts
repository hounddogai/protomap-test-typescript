import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualJourneySlotStore } from "./manual-journey-slot-store.js";
import { newManualJourneySlot } from "./manual-journey-slot.js";

test("MemoryManualJourneySlotStore finds what it saved", () => {
  const store = newMemoryManualJourneySlotStore();
  const item = newManualJourneySlot("code-16", "label-236");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
