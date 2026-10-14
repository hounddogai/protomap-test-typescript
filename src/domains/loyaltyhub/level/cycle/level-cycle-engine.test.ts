import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelCycleEngine } from "./level-cycle-engine.js";
import { newLevelCycle } from "./level-cycle.js";

test("LevelCycleEngine keeps results within bounds", () => {
  const engine = defaultLevelCycleEngine(flags.newRegistry());
  const item = newLevelCycle("code-629", "name-347");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
