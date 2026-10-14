import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredMacroPolicyEngine } from "./tiered-macro-policy-engine.js";
import { newTieredMacroPolicy } from "./tiered-macro-policy.js";

test("TieredMacroPolicyEngine keeps results within bounds", () => {
  const engine = defaultTieredMacroPolicyEngine(flags.newRegistry());
  const item = newTieredMacroPolicy("code-5", "name-589");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
