import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedTicketViewClaimEngine } from "./batched-ticket-view-claim-engine.js";
import { newBatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

test("BatchedTicketViewClaimEngine keeps results within bounds", () => {
  const engine = defaultBatchedTicketViewClaimEngine(flags.newRegistry());
  const item = newBatchedTicketViewClaim("code-215", "title-323");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
