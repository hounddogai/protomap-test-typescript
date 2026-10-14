import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationBaselineEngine } from "./reputation-baseline-engine.js";
import { newReputationBaseline } from "./reputation-baseline.js";

test("ReputationBaselineEngine keeps results within bounds", () => {
  const engine = defaultReputationBaselineEngine();
  const item = newReputationBaseline("code-316", "title-99");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
