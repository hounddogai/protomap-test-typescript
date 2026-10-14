import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveReplyThresholdEngine } from "./adaptive-reply-threshold-engine.js";
import { newAdaptiveReplyThreshold } from "./adaptive-reply-threshold.js";

test("AdaptiveReplyThresholdEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveReplyThresholdEngine(flags.newRegistry());
  const item = newAdaptiveReplyThreshold("code-315", "title-490");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
