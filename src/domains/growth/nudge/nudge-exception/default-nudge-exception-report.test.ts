import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultNudgeExceptionReport } from "./default-nudge-exception-report.js";
import { DefaultNudgeException, newDefaultNudgeException } from "./default-nudge-exception.js";

test("DefaultNudgeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_637_289);
  const items: DefaultNudgeException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultNudgeException(`default-nudge-exception-${index}`, "sample"));
  }
  const report = buildDefaultNudgeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
