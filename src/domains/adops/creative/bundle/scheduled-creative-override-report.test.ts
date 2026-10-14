import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledCreativeOverrideReport } from "./scheduled-creative-override-report.js";
import { ScheduledCreativeOverride, newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("ScheduledCreativeOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_051_981);
  const items: ScheduledCreativeOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledCreativeOverride(`scheduled-creative-override-${index}`, "sample"));
  }
  const report = buildScheduledCreativeOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
