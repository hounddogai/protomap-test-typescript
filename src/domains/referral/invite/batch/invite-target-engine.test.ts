import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteTargetEngine } from "./invite-target-engine.js";
import { newInviteTarget } from "./invite-target.js";

test("InviteTargetEngine keeps results within bounds", () => {
  const engine = defaultInviteTargetEngine();
  const item = newInviteTarget("code-290", "label-183");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
