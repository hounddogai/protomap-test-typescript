import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyClaimEngine } from "./reply-claim-engine.js";
import { newReplyClaim } from "./reply-claim.js";

test("ReplyClaimEngine keeps results within bounds", () => {
  const engine = defaultReplyClaimEngine(flags.newRegistry());
  const item = newReplyClaim("code-249", "name-713");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
