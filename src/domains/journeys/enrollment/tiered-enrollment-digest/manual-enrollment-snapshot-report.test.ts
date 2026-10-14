import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualEnrollmentSnapshotReport } from "./manual-enrollment-snapshot-report.js";
import { ManualEnrollmentSnapshot, newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("ManualEnrollmentSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_856_203);
  const items: ManualEnrollmentSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualEnrollmentSnapshot(`manual-enrollment-snapshot-${index}`, "sample"));
  }
  const report = buildManualEnrollmentSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
