import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingInviteRollupEngine } from "./pending-invite-rollup-engine.js";
import { newPendingInviteRollup } from "./pending-invite-rollup.js";

test("PendingInviteRollupEngine keeps results within bounds", () => {
  const engine = defaultPendingInviteRollupEngine(flags.newRegistry());
  const item = newPendingInviteRollup("code-173", "title-251");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
