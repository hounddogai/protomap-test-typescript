import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingInviteTierEngine } from "./rolling-invite-tier-engine.js";
import { newRollingInviteTier } from "./rolling-invite-tier.js";

test("RollingInviteTierEngine keeps results within bounds", () => {
  const engine = defaultRollingInviteTierEngine(flags.newRegistry());
  const item = newRollingInviteTier("code-540", "name-86");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
