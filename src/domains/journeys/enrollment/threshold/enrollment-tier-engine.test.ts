import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentTierEngine } from "./enrollment-tier-engine.js";
import { newEnrollmentTier } from "./enrollment-tier.js";

test("EnrollmentTierEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentTierEngine();
  const item = newEnrollmentTier("code-261", "title-87");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
