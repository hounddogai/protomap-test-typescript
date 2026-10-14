import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackEnrollmentBaselineEngine } from "./fallback-enrollment-baseline-engine.js";
import { newFallbackEnrollmentBaseline } from "./fallback-enrollment-baseline.js";

test("FallbackEnrollmentBaselineEngine keeps results within bounds", () => {
  const engine = defaultFallbackEnrollmentBaselineEngine();
  const item = newFallbackEnrollmentBaseline("code-919", "label-173");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
