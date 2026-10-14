import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledWaitCycleEngine } from "./scheduled-wait-cycle-engine.js";
import { newScheduledWaitCycle } from "./scheduled-wait-cycle.js";

test("ScheduledWaitCycleEngine keeps results within bounds", () => {
  const engine = defaultScheduledWaitCycleEngine();
  const item = newScheduledWaitCycle("code-667", "title-389");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
