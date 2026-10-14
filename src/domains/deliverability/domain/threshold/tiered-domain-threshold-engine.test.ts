import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredDomainThresholdEngine } from "./tiered-domain-threshold-engine.js";
import { newTieredDomainThreshold } from "./tiered-domain-threshold.js";

test("TieredDomainThresholdEngine keeps results within bounds", () => {
  const engine = defaultTieredDomainThresholdEngine(flags.newRegistry());
  const item = newTieredDomainThreshold("code-697", "name-471");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
