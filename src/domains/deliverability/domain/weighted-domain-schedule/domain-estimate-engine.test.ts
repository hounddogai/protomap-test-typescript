import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainEstimateEngine } from "./domain-estimate-engine.js";
import { newDomainEstimate } from "./domain-estimate.js";

test("DomainEstimateEngine keeps results within bounds", () => {
  const engine = defaultDomainEstimateEngine(flags.newRegistry());
  const item = newDomainEstimate("code-992", "label-515");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
