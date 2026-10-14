import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictInvitePolicyEngine } from "./strict-invite-policy-engine.js";
import { newStrictInvitePolicy } from "./strict-invite-policy.js";

test("StrictInvitePolicyEngine keeps results within bounds", () => {
  const engine = defaultStrictInvitePolicyEngine(flags.newRegistry());
  const item = newStrictInvitePolicy("code-713", "title-412");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
