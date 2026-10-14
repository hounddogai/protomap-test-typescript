import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentBundleEngine } from "./enrollment-bundle-engine.js";
import { newEnrollmentBundle } from "./enrollment-bundle.js";

test("EnrollmentBundleEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentBundleEngine();
  const item = newEnrollmentBundle("code-795", "title-22");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
