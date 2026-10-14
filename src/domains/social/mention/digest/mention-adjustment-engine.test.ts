import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionAdjustmentEngine } from "./mention-adjustment-engine.js";
import { newMentionAdjustment } from "./mention-adjustment.js";

test("MentionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultMentionAdjustmentEngine(flags.newRegistry());
  const item = newMentionAdjustment("code-365", "label-233");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
