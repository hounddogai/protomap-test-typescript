import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingSlaBaselineReport } from "./pending-sla-baseline-report.js";
import { PendingSlaBaseline, newPendingSlaBaseline } from "./pending-sla-baseline.js";

test("PendingSlaBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_425_951);
  const items: PendingSlaBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingSlaBaseline(`pending-sla-baseline-${index}`, "sample"));
  }
  const report = buildPendingSlaBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
