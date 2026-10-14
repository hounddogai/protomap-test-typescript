import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryApprovalSnapshotReport } from "./primary-approval-snapshot-report.js";
import { PrimaryApprovalSnapshot, newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

test("PrimaryApprovalSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_566_396);
  const items: PrimaryApprovalSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryApprovalSnapshot(`primary-approval-snapshot-${index}`, "sample"));
  }
  const report = buildPrimaryApprovalSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
