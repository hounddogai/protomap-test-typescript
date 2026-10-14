import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFlightCycleStore } from "./legacy-flight-cycle-store.js";
import { newLegacyFlightCycle } from "./legacy-flight-cycle.js";

test("MemoryLegacyFlightCycleStore finds what it saved", () => {
  const store = newMemoryLegacyFlightCycleStore();
  const item = newLegacyFlightCycle("code-827", "title-628");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
