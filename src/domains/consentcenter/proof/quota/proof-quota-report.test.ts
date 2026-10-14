import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofQuotaReport } from "./proof-quota-report.js";
import { ProofQuota, newProofQuota } from "./proof-quota.js";

test("ProofQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_692_499);
  const items: ProofQuota[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newProofQuota(`proof-quota-${index}`, "sample"));
  }
  const report = buildProofQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
