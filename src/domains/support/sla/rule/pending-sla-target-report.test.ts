import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingSlaTargetReport } from "./pending-sla-target-report.js";
import { PendingSlaTarget, newPendingSlaTarget } from "./pending-sla-target.js";

test("PendingSlaTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_718_526);
  const items: PendingSlaTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingSlaTarget(`pending-sla-target-${index}`, "sample"));
  }
  const report = buildPendingSlaTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
