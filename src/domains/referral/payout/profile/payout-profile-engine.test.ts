import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutProfileEngine } from "./payout-profile-engine.js";
import { newPayoutProfile } from "./payout-profile.js";

test("PayoutProfileEngine keeps results within bounds", () => {
  const engine = defaultPayoutProfileEngine(flags.newRegistry());
  const item = newPayoutProfile("code-83", "name-193");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
