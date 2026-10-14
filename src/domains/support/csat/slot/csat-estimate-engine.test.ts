import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatEstimateEngine } from "./csat-estimate-engine.js";
import { newCsatEstimate } from "./csat-estimate.js";

test("CsatEstimateEngine keeps results within bounds", () => {
  const engine = defaultCsatEstimateEngine();
  const item = newCsatEstimate("code-100", "label-995");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
