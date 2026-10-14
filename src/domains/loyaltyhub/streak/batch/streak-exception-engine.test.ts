import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakExceptionEngine } from "./streak-exception-engine.js";
import { newStreakException } from "./streak-exception.js";

test("StreakExceptionEngine keeps results within bounds", () => {
  const engine = defaultStreakExceptionEngine(flags.newRegistry());
  const item = newStreakException("code-926", "name-75");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
