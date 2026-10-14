import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelAllocationEngine } from "./level-allocation-engine.js";
import { newLevelAllocation } from "./level-allocation.js";

test("LevelAllocationEngine keeps results within bounds", () => {
  const engine = defaultLevelAllocationEngine();
  const item = newLevelAllocation("code-786", "title-804");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
