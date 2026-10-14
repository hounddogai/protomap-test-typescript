import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyProofTierEngine } from "./legacy-proof-tier-engine.js";
import { newLegacyProofTier } from "./legacy-proof-tier.js";

test("LegacyProofTierEngine keeps results within bounds", () => {
  const engine = defaultLegacyProofTierEngine();
  const item = newLegacyProofTier("code-971", "label-819");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
