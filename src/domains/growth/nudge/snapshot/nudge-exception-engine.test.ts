import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeExceptionEngine } from "./nudge-exception-engine.js";
import { newNudgeException } from "./nudge-exception.js";

test("NudgeExceptionEngine keeps results within bounds", () => {
  const engine = defaultNudgeExceptionEngine();
  const item = newNudgeException("code-839", "label-861");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
