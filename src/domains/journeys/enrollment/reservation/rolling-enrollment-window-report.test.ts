import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingEnrollmentWindowReport } from "./rolling-enrollment-window-report.js";
import { RollingEnrollmentWindow, newRollingEnrollmentWindow } from "./rolling-enrollment-window.js";

test("RollingEnrollmentWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_420_337);
  const items: RollingEnrollmentWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingEnrollmentWindow(`rolling-enrollment-window-${index}`, "sample"));
  }
  const report = buildRollingEnrollmentWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
