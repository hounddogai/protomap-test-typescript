import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeBaselineEngine } from "./nudge-baseline-engine.js";
import { newNudgeBaseline } from "./nudge-baseline.js";

test("NudgeBaselineEngine keeps results within bounds", () => {
  const engine = defaultNudgeBaselineEngine(flags.newRegistry());
  const item = newNudgeBaseline("code-965", "title-988");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
