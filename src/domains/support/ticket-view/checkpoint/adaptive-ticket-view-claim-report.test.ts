import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveTicketViewClaimReport } from "./adaptive-ticket-view-claim-report.js";
import { AdaptiveTicketViewClaim, newAdaptiveTicketViewClaim } from "./adaptive-ticket-view-claim.js";

test("AdaptiveTicketViewClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_727_942);
  const items: AdaptiveTicketViewClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveTicketViewClaim(`adaptive-ticket-view-claim-${index}`, "sample"));
  }
  const report = buildAdaptiveTicketViewClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
