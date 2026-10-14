import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredDeflectionTierEngine } from "./tiered-deflection-tier-engine.js";
import { newTieredDeflectionTier } from "./tiered-deflection-tier.js";

test("TieredDeflectionTierEngine keeps results within bounds", () => {
  const engine = defaultTieredDeflectionTierEngine(flags.newRegistry());
  const item = newTieredDeflectionTier("code-477", "label-93");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
