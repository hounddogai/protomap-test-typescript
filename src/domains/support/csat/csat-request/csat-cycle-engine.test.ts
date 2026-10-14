import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatCycleEngine } from "./csat-cycle-engine.js";
import { newCsatCycle } from "./csat-cycle.js";

test("CsatCycleEngine keeps results within bounds", () => {
  const engine = defaultCsatCycleEngine();
  const item = newCsatCycle("code-684", "name-80");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
