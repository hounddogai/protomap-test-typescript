import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledMentionMappingEngine } from "./scheduled-mention-mapping-engine.js";
import { newScheduledMentionMapping } from "./scheduled-mention-mapping.js";

test("ScheduledMentionMappingEngine keeps results within bounds", () => {
  const engine = defaultScheduledMentionMappingEngine(flags.newRegistry());
  const item = newScheduledMentionMapping("code-966", "label-507");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
