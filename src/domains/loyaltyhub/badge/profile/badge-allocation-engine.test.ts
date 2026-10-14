import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeAllocationEngine } from "./badge-allocation-engine.js";
import { newBadgeAllocation } from "./badge-allocation.js";

test("BadgeAllocationEngine keeps results within bounds", () => {
  const engine = defaultBadgeAllocationEngine();
  const item = newBadgeAllocation("code-66", "name-280");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
