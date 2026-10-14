import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentCycleStore } from "./enrollment-cycle-store.js";
import { newEnrollmentCycle } from "./enrollment-cycle.js";

test("MemoryEnrollmentCycleStore finds what it saved", () => {
  const store = newMemoryEnrollmentCycleStore();
  const item = newEnrollmentCycle("code-815", "name-667");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
