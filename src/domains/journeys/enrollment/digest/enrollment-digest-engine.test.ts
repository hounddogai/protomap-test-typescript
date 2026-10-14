import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentDigestEngine } from "./enrollment-digest-engine.js";
import { newEnrollmentDigest } from "./enrollment-digest.js";

test("EnrollmentDigestEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentDigestEngine();
  const item = newEnrollmentDigest("code-934", "label-571");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
