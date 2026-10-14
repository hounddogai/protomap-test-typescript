import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultLevelCycleEngine } from "./default-level-cycle-engine.js";
import { newDefaultLevelCycle } from "./default-level-cycle.js";

test("DefaultLevelCycleEngine keeps results within bounds", () => {
  const engine = defaultDefaultLevelCycleEngine();
  const item = newDefaultLevelCycle("code-564", "name-630");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
