import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentSnapshotReport } from "./enrollment-snapshot-report.js";
import { EnrollmentSnapshot, newEnrollmentSnapshot } from "./enrollment-snapshot.js";

test("EnrollmentSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_653_575);
  const items: EnrollmentSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEnrollmentSnapshot(`enrollment-snapshot-${index}`, "sample"));
  }
  const report = buildEnrollmentSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
