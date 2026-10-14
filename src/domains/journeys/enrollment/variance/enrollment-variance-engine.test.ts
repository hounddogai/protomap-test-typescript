import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentVarianceEngine } from "./enrollment-variance-engine.js";
import { newEnrollmentVariance } from "./enrollment-variance.js";

test("EnrollmentVarianceEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentVarianceEngine(flags.newRegistry());
  const item = newEnrollmentVariance("code-137", "name-128");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
