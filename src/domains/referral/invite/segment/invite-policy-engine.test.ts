import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInvitePolicyEngine } from "./invite-policy-engine.js";
import { newInvitePolicy } from "./invite-policy.js";

test("InvitePolicyEngine keeps results within bounds", () => {
  const engine = defaultInvitePolicyEngine();
  const item = newInvitePolicy("code-881", "title-973");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
