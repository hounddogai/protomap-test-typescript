import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingOptOutTierEngine } from "./pending-opt-out-tier-engine.js";
import { newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("PendingOptOutTierEngine keeps results within bounds", () => {
  const engine = defaultPendingOptOutTierEngine(flags.newRegistry());
  const item = newPendingOptOutTier("code-104", "name-415");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
