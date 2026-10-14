import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationClaimReport } from "./escalation-claim-report.js";
import { EscalationClaim, newEscalationClaim } from "./escalation-claim.js";

test("EscalationClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_232_635);
  const items: EscalationClaim[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEscalationClaim(`escalation-claim-${index}`, "sample"));
  }
  const report = buildEscalationClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
