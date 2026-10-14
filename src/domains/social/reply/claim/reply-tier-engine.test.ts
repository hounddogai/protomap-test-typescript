import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyTierEngine } from "./reply-tier-engine.js";
import { newReplyTier } from "./reply-tier.js";

test("ReplyTierEngine keeps results within bounds", () => {
  const engine = defaultReplyTierEngine(flags.newRegistry());
  const item = newReplyTier("code-574", "title-696");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
