import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedNudgeExceptionReport } from "./capped-nudge-exception-report.js";
import { CappedNudgeException, newCappedNudgeException } from "./capped-nudge-exception.js";

test("CappedNudgeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_102_913);
  const items: CappedNudgeException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedNudgeException(`capped-nudge-exception-${index}`, "sample"));
  }
  const report = buildCappedNudgeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
