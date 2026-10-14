import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictStreakTemplateReport } from "./strict-streak-template-report.js";
import { StrictStreakTemplate, newStrictStreakTemplate } from "./strict-streak-template.js";

test("StrictStreakTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_213_484);
  const items: StrictStreakTemplate[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictStreakTemplate(`strict-streak-template-${index}`, "sample"));
  }
  const report = buildStrictStreakTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
