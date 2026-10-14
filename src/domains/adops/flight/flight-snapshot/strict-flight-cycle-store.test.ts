import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFlightCycleStore } from "./strict-flight-cycle-store.js";
import { newStrictFlightCycle } from "./strict-flight-cycle.js";

test("MemoryStrictFlightCycleStore finds what it saved", () => {
  const store = newMemoryStrictFlightCycleStore();
  const item = newStrictFlightCycle("code-37", "label-749");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
