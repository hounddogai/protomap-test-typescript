import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentEntryEngine } from "./enrollment-entry-engine.js";
import { newEnrollmentEntry } from "./enrollment-entry.js";

test("EnrollmentEntryEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentEntryEngine(flags.newRegistry());
  const item = newEnrollmentEntry("code-608", "name-459");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
