import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteCycleEngine } from "./invite-cycle-engine.js";
import { newInviteCycle } from "./invite-cycle.js";

test("InviteCycleEngine keeps results within bounds", () => {
  const engine = defaultInviteCycleEngine(flags.newRegistry());
  const item = newInviteCycle("code-192", "label-915");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
