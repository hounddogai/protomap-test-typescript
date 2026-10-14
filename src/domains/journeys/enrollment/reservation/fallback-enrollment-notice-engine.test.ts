import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackEnrollmentNoticeEngine } from "./fallback-enrollment-notice-engine.js";
import { newFallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

test("FallbackEnrollmentNoticeEngine keeps results within bounds", () => {
  const engine = defaultFallbackEnrollmentNoticeEngine();
  const item = newFallbackEnrollmentNotice("code-975", "title-167");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
