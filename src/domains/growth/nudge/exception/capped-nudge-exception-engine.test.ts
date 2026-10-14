import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedNudgeExceptionEngine } from "./capped-nudge-exception-engine.js";
import { newCappedNudgeException } from "./capped-nudge-exception.js";

test("CappedNudgeExceptionEngine keeps results within bounds", () => {
  const engine = defaultCappedNudgeExceptionEngine(flags.newRegistry());
  const item = newCappedNudgeException("code-99", "label-99");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
