import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalEscalationVarianceEngine } from "./regional-escalation-variance-engine.js";
import { newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("RegionalEscalationVarianceEngine keeps results within bounds", () => {
  const engine = defaultRegionalEscalationVarianceEngine(flags.newRegistry());
  const item = newRegionalEscalationVariance("code-630", "name-998");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
