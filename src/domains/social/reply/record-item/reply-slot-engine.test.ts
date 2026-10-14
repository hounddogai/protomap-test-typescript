import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplySlotEngine } from "./reply-slot-engine.js";
import { newReplySlot } from "./reply-slot.js";

test("ReplySlotEngine keeps results within bounds", () => {
  const engine = defaultReplySlotEngine(flags.newRegistry());
  const item = newReplySlot("code-519", "title-838");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
