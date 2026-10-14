import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionThresholdEngine } from "./mention-threshold-engine.js";
import { newMentionThreshold } from "./mention-threshold.js";

test("MentionThresholdEngine keeps results within bounds", () => {
  const engine = defaultMentionThresholdEngine(flags.newRegistry());
  const item = newMentionThreshold("code-661", "title-791");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
