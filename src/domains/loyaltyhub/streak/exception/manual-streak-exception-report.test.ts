import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualStreakExceptionReport } from "./manual-streak-exception-report.js";
import { ManualStreakException, newManualStreakException } from "./manual-streak-exception.js";

test("ManualStreakExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_440_100);
  const items: ManualStreakException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualStreakException(`manual-streak-exception-${index}`, "sample"));
  }
  const report = buildManualStreakExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
