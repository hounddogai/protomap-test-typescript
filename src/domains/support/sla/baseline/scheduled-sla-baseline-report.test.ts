import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSlaBaselineReport } from "./scheduled-sla-baseline-report.js";
import { ScheduledSlaBaseline, newScheduledSlaBaseline } from "./scheduled-sla-baseline.js";

test("ScheduledSlaBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_558_276);
  const items: ScheduledSlaBaseline[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledSlaBaseline(`scheduled-sla-baseline-${index}`, "sample"));
  }
  const report = buildScheduledSlaBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
