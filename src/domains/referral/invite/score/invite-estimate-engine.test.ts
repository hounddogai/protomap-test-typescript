import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteEstimateEngine } from "./invite-estimate-engine.js";
import { newInviteEstimate } from "./invite-estimate.js";

test("InviteEstimateEngine keeps results within bounds", () => {
  const engine = defaultInviteEstimateEngine(flags.newRegistry());
  const item = newInviteEstimate("code-914", "label-343");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
