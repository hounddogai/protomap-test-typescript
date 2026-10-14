import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeSummaryReport } from "./creative-summary-report.js";
import { CreativeSummary, newCreativeSummary } from "./creative-summary.js";

test("CreativeSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_353_153);
  const items: CreativeSummary[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeSummary(`creative-summary-${index}`, "sample"));
  }
  const report = buildCreativeSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
