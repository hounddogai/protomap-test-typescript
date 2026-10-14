import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRetentionTierEngine } from "./global-retention-tier-engine.js";
import { newGlobalRetentionTier } from "./global-retention-tier.js";

test("GlobalRetentionTierEngine keeps results within bounds", () => {
  const engine = defaultGlobalRetentionTierEngine(flags.newRegistry());
  const item = newGlobalRetentionTier("code-796", "title-794");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
