import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalProofClaimEngine } from "./seasonal-proof-claim-engine.js";
import { newSeasonalProofClaim } from "./seasonal-proof-claim.js";

test("SeasonalProofClaimEngine keeps results within bounds", () => {
  const engine = defaultSeasonalProofClaimEngine(flags.newRegistry());
  const item = newSeasonalProofClaim("code-829", "title-819");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
