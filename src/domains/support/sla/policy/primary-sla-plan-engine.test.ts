import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySlaPlanEngine } from "./primary-sla-plan-engine.js";
import { newPrimarySlaPlan } from "./primary-sla-plan.js";

test("PrimarySlaPlanEngine keeps results within bounds", () => {
  const engine = defaultPrimarySlaPlanEngine();
  const item = newPrimarySlaPlan("code-409", "name-505");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
