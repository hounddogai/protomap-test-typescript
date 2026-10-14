import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionSlotEngine } from "./mention-slot-engine.js";
import { newMentionSlot } from "./mention-slot.js";

test("MentionSlotEngine keeps results within bounds", () => {
  const engine = defaultMentionSlotEngine();
  const item = newMentionSlot("code-335", "label-823");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
