import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPathSlotStore } from "./primary-path-slot-store.js";
import { newPrimaryPathSlot } from "./primary-path-slot.js";

test("MemoryPrimaryPathSlotStore finds what it saved", () => {
  const store = newMemoryPrimaryPathSlotStore();
  const item = newPrimaryPathSlot("code-731", "name-116");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
