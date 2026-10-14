import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultNudgeExceptionEngine } from "./default-nudge-exception-engine.js";
import { newDefaultNudgeException } from "./default-nudge-exception.js";

test("DefaultNudgeExceptionEngine keeps results within bounds", () => {
  const engine = defaultDefaultNudgeExceptionEngine(flags.newRegistry());
  const item = newDefaultNudgeException("code-791", "label-69");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
