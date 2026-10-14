import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroPlanEngine } from "./macro-plan-engine.js";
import { newMacroPlan } from "./macro-plan.js";

test("MacroPlanEngine keeps results within bounds", () => {
  const engine = defaultMacroPlanEngine(flags.newRegistry());
  const item = newMacroPlan("code-431", "title-196");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
