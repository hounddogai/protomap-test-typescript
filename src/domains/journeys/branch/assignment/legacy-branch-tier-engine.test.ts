import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyBranchTierEngine } from "./legacy-branch-tier-engine.js";
import { newLegacyBranchTier } from "./legacy-branch-tier.js";

test("LegacyBranchTierEngine keeps results within bounds", () => {
  const engine = defaultLegacyBranchTierEngine(flags.newRegistry());
  const item = newLegacyBranchTier("code-46", "title-495");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
