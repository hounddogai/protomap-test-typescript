import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualSlaPlanEngine } from "./manual-sla-plan-engine.js";
import { newManualSlaPlan } from "./manual-sla-plan.js";

test("ManualSlaPlanEngine keeps results within bounds", () => {
  const engine = defaultManualSlaPlanEngine(flags.newRegistry());
  const item = newManualSlaPlan("code-770", "label-314");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
