import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveTicketViewClaimEngine } from "./adaptive-ticket-view-claim-engine.js";
import { newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

test("AdaptiveTicketViewClaimEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveTicketViewClaimEngine();
  const item = newAdaptiveTicketViewClaim("code-596", "label-607");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
