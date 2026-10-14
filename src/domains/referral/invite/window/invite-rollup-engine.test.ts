import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteRollupEngine } from "./invite-rollup-engine.js";
import { newInviteRollup } from "./invite-rollup.js";

test("InviteRollupEngine keeps results within bounds", () => {
  const engine = defaultInviteRollupEngine(flags.newRegistry());
  const item = newInviteRollup("code-820", "label-843");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
