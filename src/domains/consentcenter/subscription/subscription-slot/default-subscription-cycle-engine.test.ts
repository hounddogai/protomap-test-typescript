import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultSubscriptionCycleEngine } from "./default-subscription-cycle-engine.js";
import { newDefaultSubscriptionCycle } from "./default-subscription-cycle.js";

test("DefaultSubscriptionCycleEngine keeps results within bounds", () => {
  const engine = defaultDefaultSubscriptionCycleEngine(flags.newRegistry());
  const item = newDefaultSubscriptionCycle("code-943", "label-591");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
