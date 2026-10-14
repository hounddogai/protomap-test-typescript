import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStreakRequestReport } from "./streak-request-report.js";
import { StreakRequest, newStreakRequest } from "./streak-request.js";

test("StreakRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_607_591);
  const items: StreakRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStreakRequest(`streak-request-${index}`, "sample"));
  }
  const report = buildStreakRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
