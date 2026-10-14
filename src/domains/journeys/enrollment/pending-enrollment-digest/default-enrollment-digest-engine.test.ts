import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultEnrollmentDigestEngine } from "./default-enrollment-digest-engine.js";
import { newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

test("DefaultEnrollmentDigestEngine keeps results within bounds", () => {
  const engine = defaultDefaultEnrollmentDigestEngine();
  const item = newDefaultEnrollmentDigest("code-77", "title-523");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
