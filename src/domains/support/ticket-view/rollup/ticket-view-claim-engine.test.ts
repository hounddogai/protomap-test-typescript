import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewClaimEngine } from "./ticket-view-claim-engine.js";
import { newTicketViewClaim } from "./ticket-view-claim.js";

test("TicketViewClaimEngine keeps results within bounds", () => {
  const engine = defaultTicketViewClaimEngine(flags.newRegistry());
  const item = newTicketViewClaim("code-846", "name-765");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
