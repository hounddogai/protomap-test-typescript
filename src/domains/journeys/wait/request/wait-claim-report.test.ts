import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitClaimReport } from "./wait-claim-report.js";
import { WaitClaim, newWaitClaim } from "./wait-claim.js";

test("WaitClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_393_355);
  const items: WaitClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWaitClaim(`wait-claim-${index}`, "sample"));
  }
  const report = buildWaitClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
