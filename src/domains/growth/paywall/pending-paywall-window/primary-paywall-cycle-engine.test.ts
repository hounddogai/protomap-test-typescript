import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPaywallCycleEngine } from "./primary-paywall-cycle-engine.js";
import { newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

test("PrimaryPaywallCycleEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPaywallCycleEngine(flags.newRegistry());
  const item = newPrimaryPaywallCycle("code-481", "label-699");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
