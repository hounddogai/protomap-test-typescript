import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyBaselineEngine } from "./reply-baseline-engine.js";
import { newReplyBaseline } from "./reply-baseline.js";

test("ReplyBaselineEngine keeps results within bounds", () => {
  const engine = defaultReplyBaselineEngine();
  const item = newReplyBaseline("code-214", "label-574");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
