import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaPlanEngine } from "./sla-plan-engine.js";
import { newSlaPlan } from "./sla-plan.js";

test("SlaPlanEngine keeps results within bounds", () => {
  const engine = defaultSlaPlanEngine(flags.newRegistry());
  const item = newSlaPlan("code-228", "title-72");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
