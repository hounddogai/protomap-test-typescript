import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackReplyTargetEngine } from "./fallback-reply-target-engine.js";
import { newFallbackReplyTarget } from "./fallback-reply-target.js";

test("FallbackReplyTargetEngine keeps results within bounds", () => {
  const engine = defaultFallbackReplyTargetEngine(flags.newRegistry());
  const item = newFallbackReplyTarget("code-257", "title-451");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
