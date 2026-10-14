import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalDomainThresholdEngine } from "./global-domain-threshold-engine.js";
import { newGlobalDomainThreshold } from "./global-domain-threshold.js";

test("GlobalDomainThresholdEngine keeps results within bounds", () => {
  const engine = defaultGlobalDomainThresholdEngine();
  const item = newGlobalDomainThreshold("code-789", "name-441");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
