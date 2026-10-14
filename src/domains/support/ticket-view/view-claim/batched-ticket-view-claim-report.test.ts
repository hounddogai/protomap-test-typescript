import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedTicketViewClaimReport } from "./batched-ticket-view-claim-report.js";
import { BatchedTicketViewClaim, newBatchedTicketViewClaim } from "./batched-ticket-view-claim.js";

test("BatchedTicketViewClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_913_728);
  const items: BatchedTicketViewClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedTicketViewClaim(`batched-ticket-view-claim-${index}`, "sample"));
  }
  const report = buildBatchedTicketViewClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
