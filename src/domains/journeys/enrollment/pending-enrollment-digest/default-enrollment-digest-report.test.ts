import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultEnrollmentDigestReport } from "./default-enrollment-digest-report.js";
import { DefaultEnrollmentDigest, newDefaultEnrollmentDigest } from "./default-enrollment-digest.js";

test("DefaultEnrollmentDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_450_156);
  const items: DefaultEnrollmentDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultEnrollmentDigest(`default-enrollment-digest-${index}`, "sample"));
  }
  const report = buildDefaultEnrollmentDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
