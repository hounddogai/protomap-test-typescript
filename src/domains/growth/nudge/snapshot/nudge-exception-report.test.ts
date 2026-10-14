import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeExceptionReport } from "./nudge-exception-report.js";
import { NudgeException, newNudgeException } from "./nudge-exception.js";

test("NudgeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_885_857);
  const items: NudgeException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newNudgeException(`nudge-exception-${index}`, "sample"));
  }
  const report = buildNudgeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
