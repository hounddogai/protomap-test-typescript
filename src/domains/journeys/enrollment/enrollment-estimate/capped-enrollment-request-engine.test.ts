import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedEnrollmentRequestEngine } from "./capped-enrollment-request-engine.js";
import { newCappedEnrollmentRequest } from "./capped-enrollment-request.js";

test("CappedEnrollmentRequestEngine keeps results within bounds", () => {
  const engine = defaultCappedEnrollmentRequestEngine();
  const item = newCappedEnrollmentRequest("code-572", "title-498");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
