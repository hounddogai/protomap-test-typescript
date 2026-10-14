import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalEscalationEstimateEngine } from "./regional-escalation-estimate-engine.js";
import { newRegionalEscalationEstimate } from "./regional-escalation-estimate.js";

test("RegionalEscalationEstimateEngine keeps results within bounds", () => {
  const engine = defaultRegionalEscalationEstimateEngine(flags.newRegistry());
  const item = newRegionalEscalationEstimate("code-401", "name-515");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
