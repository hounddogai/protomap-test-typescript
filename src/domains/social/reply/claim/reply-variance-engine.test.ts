import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyVarianceEngine } from "./reply-variance-engine.js";
import { newReplyVariance } from "./reply-variance.js";

test("ReplyVarianceEngine keeps results within bounds", () => {
  const engine = defaultReplyVarianceEngine(flags.newRegistry());
  const item = newReplyVariance("code-82", "name-406");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
