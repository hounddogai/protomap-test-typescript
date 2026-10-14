import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationClaimReport } from "./activation-claim-report.js";
import { ActivationClaim, newActivationClaim } from "./activation-claim.js";

test("ActivationClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_085_220);
  const items: ActivationClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationClaim(`activation-claim-${index}`, "sample"));
  }
  const report = buildActivationClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
