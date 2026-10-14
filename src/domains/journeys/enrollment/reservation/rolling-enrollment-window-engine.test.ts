import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingEnrollmentWindowEngine } from "./rolling-enrollment-window-engine.js";
import { newRollingEnrollmentWindow } from "./rolling-enrollment-window.js";

test("RollingEnrollmentWindowEngine keeps results within bounds", () => {
  const engine = defaultRollingEnrollmentWindowEngine(flags.newRegistry());
  const item = newRollingEnrollmentWindow("code-508", "title-549");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
