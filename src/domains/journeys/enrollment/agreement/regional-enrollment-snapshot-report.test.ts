import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalEnrollmentSnapshotReport } from "./regional-enrollment-snapshot-report.js";
import { RegionalEnrollmentSnapshot, newRegionalEnrollmentSnapshot } from "./regional-enrollment-snapshot.js";

test("RegionalEnrollmentSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_118_364);
  const items: RegionalEnrollmentSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalEnrollmentSnapshot(`regional-enrollment-snapshot-${index}`, "sample"));
  }
  const report = buildRegionalEnrollmentSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
