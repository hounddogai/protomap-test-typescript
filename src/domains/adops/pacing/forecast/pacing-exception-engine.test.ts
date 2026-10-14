import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingExceptionEngine } from "./pacing-exception-engine.js";
import { newPacingException } from "./pacing-exception.js";

test("PacingExceptionEngine keeps results within bounds", () => {
  const engine = defaultPacingExceptionEngine(flags.newRegistry());
  const item = newPacingException("code-91", "title-810");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
