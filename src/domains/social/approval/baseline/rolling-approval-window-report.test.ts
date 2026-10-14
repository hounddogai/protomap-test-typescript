import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingApprovalWindowReport } from "./rolling-approval-window-report.js";
import { RollingApprovalWindow, newRollingApprovalWindow } from "./rolling-approval-window.js";

test("RollingApprovalWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_084_282);
  const items: RollingApprovalWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingApprovalWindow(`rolling-approval-window-${index}`, "sample"));
  }
  const report = buildRollingApprovalWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
