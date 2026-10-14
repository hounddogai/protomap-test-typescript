import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyProofClaimEngine } from "./legacy-proof-claim-engine.js";
import { newLegacyProofClaim } from "./legacy-proof-claim.js";

test("LegacyProofClaimEngine keeps results within bounds", () => {
  const engine = defaultLegacyProofClaimEngine(flags.newRegistry());
  const item = newLegacyProofClaim("code-76", "name-188");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
