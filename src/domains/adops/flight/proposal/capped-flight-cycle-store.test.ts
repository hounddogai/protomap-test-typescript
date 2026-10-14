import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFlightCycleStore } from "./capped-flight-cycle-store.js";
import { newCappedFlightCycle } from "./capped-flight-cycle.js";

test("MemoryCappedFlightCycleStore finds what it saved", () => {
  const store = newMemoryCappedFlightCycleStore();
  const item = newCappedFlightCycle("code-382", "label-117");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
