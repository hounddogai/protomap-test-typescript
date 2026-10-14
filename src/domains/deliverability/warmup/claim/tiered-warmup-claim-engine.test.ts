import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredWarmupClaimEngine } from "./tiered-warmup-claim-engine.js";
import { newTieredWarmupClaim } from "./tiered-warmup-claim.js";

test("TieredWarmupClaimEngine keeps results within bounds", () => {
  const engine = defaultTieredWarmupClaimEngine();
  const item = newTieredWarmupClaim("code-227", "label-176");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
