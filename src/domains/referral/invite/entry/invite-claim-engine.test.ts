import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteClaimEngine } from "./invite-claim-engine.js";
import { newInviteClaim } from "./invite-claim.js";

test("InviteClaimEngine keeps results within bounds", () => {
  const engine = defaultInviteClaimEngine(flags.newRegistry());
  const item = newInviteClaim("code-674", "name-168");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
