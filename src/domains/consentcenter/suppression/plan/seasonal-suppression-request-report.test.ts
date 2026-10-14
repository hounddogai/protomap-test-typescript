import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSuppressionRequestReport } from "./seasonal-suppression-request-report.js";
import { SeasonalSuppressionRequest, newSeasonalSuppressionRequest } from "./seasonal-suppression-request.js";

test("SeasonalSuppressionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_552_856);
  const items: SeasonalSuppressionRequest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalSuppressionRequest(`seasonal-suppression-request-${index}`, "sample"));
  }
  const report = buildSeasonalSuppressionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
