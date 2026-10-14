import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedProofTierEngine } from "./capped-proof-tier-engine.js";
import { newCappedProofTier } from "./capped-proof-tier.js";

test("CappedProofTierEngine keeps results within bounds", () => {
  const engine = defaultCappedProofTierEngine(flags.newRegistry());
  const item = newCappedProofTier("code-882", "title-921");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
