import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalInviteTargetEngine } from "./regional-invite-target-engine.js";
import { newRegionalInviteTarget } from "./regional-invite-target.js";

test("RegionalInviteTargetEngine keeps results within bounds", () => {
  const engine = defaultRegionalInviteTargetEngine(flags.newRegistry());
  const item = newRegionalInviteTarget("code-136", "label-781");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
