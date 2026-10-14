import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowCycleEngine } from "./window-cycle-engine.js";
import { newWindowCycle } from "./window-cycle.js";

test("WindowCycleEngine keeps results within bounds", () => {
  const engine = defaultWindowCycleEngine();
  const item = newWindowCycle("code-648", "title-592");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
