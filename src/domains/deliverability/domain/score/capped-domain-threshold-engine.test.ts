import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedDomainThresholdEngine } from "./capped-domain-threshold-engine.js";
import { newCappedDomainThreshold } from "./capped-domain-threshold.js";

test("CappedDomainThresholdEngine keeps results within bounds", () => {
  const engine = defaultCappedDomainThresholdEngine();
  const item = newCappedDomainThreshold("code-358", "label-533");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
