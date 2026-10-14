import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutClaimReport } from "./opt-out-claim-report.js";
import { OptOutClaim, newOptOutClaim } from "./opt-out-claim.js";

test("OptOutClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_991_216);
  const items: OptOutClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newOptOutClaim(`opt-out-claim-${index}`, "sample"));
  }
  const report = buildOptOutClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
