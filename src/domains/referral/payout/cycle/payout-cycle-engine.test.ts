import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutCycleEngine } from "./payout-cycle-engine.js";
import { newPayoutCycle } from "./payout-cycle.js";

test("PayoutCycleEngine keeps results within bounds", () => {
  const engine = defaultPayoutCycleEngine(flags.newRegistry());
  const item = newPayoutCycle("code-195", "title-636");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
