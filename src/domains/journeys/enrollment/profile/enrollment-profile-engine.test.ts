import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentProfileEngine } from "./enrollment-profile-engine.js";
import { newEnrollmentProfile } from "./enrollment-profile.js";

test("EnrollmentProfileEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentProfileEngine();
  const item = newEnrollmentProfile("code-662", "name-397");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
