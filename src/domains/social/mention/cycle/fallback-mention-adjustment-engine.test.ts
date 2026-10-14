import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackMentionAdjustmentEngine } from "./fallback-mention-adjustment-engine.js";
import { newFallbackMentionAdjustment } from "./fallback-mention-adjustment.js";

test("FallbackMentionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultFallbackMentionAdjustmentEngine(flags.newRegistry());
  const item = newFallbackMentionAdjustment("code-173", "label-273");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
