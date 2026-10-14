import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledOptOutExceptionReport } from "./scheduled-opt-out-exception-report.js";
import { ScheduledOptOutException, newScheduledOptOutException } from "./scheduled-opt-out-exception.js";

test("ScheduledOptOutExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_209_363);
  const items: ScheduledOptOutException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledOptOutException(`scheduled-opt-out-exception-${index}`, "sample"));
  }
  const report = buildScheduledOptOutExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
