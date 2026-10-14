import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictEnrollmentDigestEngine } from "./strict-enrollment-digest-engine.js";
import { newStrictEnrollmentDigest } from "./strict-enrollment-digest.js";

test("StrictEnrollmentDigestEngine keeps results within bounds", () => {
  const engine = defaultStrictEnrollmentDigestEngine();
  const item = newStrictEnrollmentDigest("code-11", "title-615");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
