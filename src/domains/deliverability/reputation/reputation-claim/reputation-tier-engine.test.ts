import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationTierEngine } from "./reputation-tier-engine.js";
import { newReputationTier } from "./reputation-tier.js";

test("ReputationTierEngine keeps results within bounds", () => {
  const engine = defaultReputationTierEngine(flags.newRegistry());
  const item = newReputationTier("code-750", "title-787");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
