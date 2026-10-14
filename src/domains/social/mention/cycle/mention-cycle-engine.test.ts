import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionCycleEngine } from "./mention-cycle-engine.js";
import { newMentionCycle } from "./mention-cycle.js";

test("MentionCycleEngine keeps results within bounds", () => {
  const engine = defaultMentionCycleEngine(flags.newRegistry());
  const item = newMentionCycle("code-662", "title-551");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
