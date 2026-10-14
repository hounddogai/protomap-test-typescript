import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalComplaintCycleEngine } from "./global-complaint-cycle-engine.js";
import { newGlobalComplaintCycle } from "./global-complaint-cycle.js";

test("GlobalComplaintCycleEngine keeps results within bounds", () => {
  const engine = defaultGlobalComplaintCycleEngine();
  const item = newGlobalComplaintCycle("code-656", "name-178");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
