import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyCycleEngine } from "./journey-cycle-engine.js";
import { newJourneyCycle } from "./journey-cycle.js";

test("JourneyCycleEngine keeps results within bounds", () => {
  const engine = defaultJourneyCycleEngine(flags.newRegistry());
  const item = newJourneyCycle("code-657", "label-597");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
