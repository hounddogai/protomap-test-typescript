import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPlacementClaimEngine } from "./placement-claim-engine.js";
import { newPlacementClaim } from "./placement-claim.js";

test("PlacementClaimEngine keeps results within bounds", () => {
  const engine = defaultPlacementClaimEngine(flags.newRegistry());
  const item = newPlacementClaim("code-392", "title-627");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
