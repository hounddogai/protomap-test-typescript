import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalNudgeGroupReport } from "./regional-nudge-group-report.js";
import { RegionalNudgeGroup, newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("RegionalNudgeGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_341_083);
  const items: RegionalNudgeGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalNudgeGroup(`regional-nudge-group-${index}`, "sample"));
  }
  const report = buildRegionalNudgeGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
