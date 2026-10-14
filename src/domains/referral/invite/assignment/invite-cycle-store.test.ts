import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteCycleStore } from "./invite-cycle-store.js";
import { newInviteCycle } from "./invite-cycle.js";

test("MemoryInviteCycleStore finds what it saved", () => {
  const store = newMemoryInviteCycleStore();
  const item = newInviteCycle("code-192", "label-915");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
