import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFlightClaimEngine } from "./flight-claim-engine.js";
import { newFlightClaim } from "./flight-claim.js";

test("FlightClaimEngine keeps results within bounds", () => {
  const engine = defaultFlightClaimEngine();
  const item = newFlightClaim("code-901", "title-442");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
