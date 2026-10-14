import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualStreakExceptionEngine } from "./manual-streak-exception-engine.js";
import { newManualStreakException } from "./manual-streak-exception.js";

test("ManualStreakExceptionEngine keeps results within bounds", () => {
  const engine = defaultManualStreakExceptionEngine(flags.newRegistry());
  const item = newManualStreakException("code-428", "name-397");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
