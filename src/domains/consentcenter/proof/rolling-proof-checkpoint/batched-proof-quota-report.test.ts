import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedProofQuotaReport } from "./batched-proof-quota-report.js";
import { BatchedProofQuota, newBatchedProofQuota } from "./batched-proof-quota.js";

test("BatchedProofQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_765_918);
  const items: BatchedProofQuota[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedProofQuota(`batched-proof-quota-${index}`, "sample"));
  }
  const report = buildBatchedProofQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
