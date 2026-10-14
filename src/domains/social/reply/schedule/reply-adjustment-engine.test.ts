import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyAdjustmentEngine } from "./reply-adjustment-engine.js";
import { newReplyAdjustment } from "./reply-adjustment.js";

test("ReplyAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultReplyAdjustmentEngine(flags.newRegistry());
  const item = newReplyAdjustment("code-354", "name-242");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
