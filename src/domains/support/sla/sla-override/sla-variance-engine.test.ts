import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaVarianceEngine } from "./sla-variance-engine.js";
import { newSlaVariance } from "./sla-variance.js";

test("SlaVarianceEngine keeps results within bounds", () => {
  const engine = defaultSlaVarianceEngine();
  const item = newSlaVariance("code-757", "title-652");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
