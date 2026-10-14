import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultDomainThresholdEngine } from "./default-domain-threshold-engine.js";
import { newDefaultDomainThreshold } from "./default-domain-threshold.js";

test("DefaultDomainThresholdEngine keeps results within bounds", () => {
  const engine = defaultDefaultDomainThresholdEngine();
  const item = newDefaultDomainThreshold("code-368", "title-56");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
