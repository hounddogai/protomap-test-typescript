import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalFlightTierEngine } from "./global-flight-tier-engine.js";
import { newGlobalFlightTier } from "./global-flight-tier.js";

test("GlobalFlightTierEngine keeps results within bounds", () => {
  const engine = defaultGlobalFlightTierEngine(flags.newRegistry());
  const item = newGlobalFlightTier("code-843", "name-387");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
