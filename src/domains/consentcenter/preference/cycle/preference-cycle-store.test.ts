import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceCycleStore } from "./preference-cycle-store.js";
import { newPreferenceCycle } from "./preference-cycle.js";

test("MemoryPreferenceCycleStore finds what it saved", () => {
  const store = newMemoryPreferenceCycleStore();
  const item = newPreferenceCycle("code-158", "name-211");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
