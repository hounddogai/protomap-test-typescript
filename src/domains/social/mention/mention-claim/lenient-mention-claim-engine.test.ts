import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientMentionClaimEngine } from "./lenient-mention-claim-engine.js";
import { newLenientMentionClaim } from "./lenient-mention-claim.js";

test("LenientMentionClaimEngine keeps results within bounds", () => {
  const engine = defaultLenientMentionClaimEngine(flags.newRegistry());
  const item = newLenientMentionClaim("code-715", "title-241");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
