import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildComplaintClaimReport } from "./complaint-claim-report.js";
import { ComplaintClaim, newComplaintClaim } from "./complaint-claim.js";

test("ComplaintClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_298_849);
  const items: ComplaintClaim[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newComplaintClaim(`complaint-claim-${index}`, "sample"));
  }
  const report = buildComplaintClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
