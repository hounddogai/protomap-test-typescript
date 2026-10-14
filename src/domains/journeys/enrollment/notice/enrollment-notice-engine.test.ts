import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentNoticeEngine } from "./enrollment-notice-engine.js";
import { newEnrollmentNotice } from "./enrollment-notice.js";

test("EnrollmentNoticeEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentNoticeEngine(flags.newRegistry());
  const item = newEnrollmentNotice("code-561", "name-597");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
