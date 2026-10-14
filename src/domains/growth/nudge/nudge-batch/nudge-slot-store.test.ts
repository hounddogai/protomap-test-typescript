import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeSlotStore } from "./nudge-slot-store.js";
import { newNudgeSlot } from "./nudge-slot.js";

test("MemoryNudgeSlotStore finds what it saved", () => {
  const store = newMemoryNudgeSlotStore();
  const item = newNudgeSlot("code-101", "name-257");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
