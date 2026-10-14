import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCsatPolicyReport } from "./seasonal-csat-policy-report.js";
import { SeasonalCsatPolicy, newSeasonalCsatPolicy } from "./seasonal-csat-policy.js";

test("SeasonalCsatPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_375_030);
  const items: SeasonalCsatPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalCsatPolicy(`seasonal-csat-policy-${index}`, "sample"));
  }
  const report = buildSeasonalCsatPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
