import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalSlaPlanEngine } from "./global-sla-plan-engine.js";
import { newGlobalSlaPlan } from "./global-sla-plan.js";

test("GlobalSlaPlanEngine keeps results within bounds", () => {
  const engine = defaultGlobalSlaPlanEngine(flags.newRegistry());
  const item = newGlobalSlaPlan("code-207", "label-614");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
