import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalFraudCheckClaimEngine } from "./seasonal-fraud-check-claim-engine.js";
import { newSeasonalFraudCheckClaim } from "./seasonal-fraud-check-claim.js";

test("SeasonalFraudCheckClaimEngine keeps results within bounds", () => {
  const engine = defaultSeasonalFraudCheckClaimEngine();
  const item = newSeasonalFraudCheckClaim("code-832", "title-782");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
