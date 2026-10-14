import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationSlotStore } from "./activation-slot-store.js";
import { newActivationSlot } from "./activation-slot.js";

test("MemoryActivationSlotStore finds what it saved", () => {
  const store = newMemoryActivationSlotStore();
  const item = newActivationSlot("code-697", "name-444");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
