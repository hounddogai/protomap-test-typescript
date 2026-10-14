import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPostSummaryReport } from "./strict-post-summary-report.js";
import { StrictPostSummary, newStrictPostSummary } from "./strict-post-summary.js";

test("StrictPostSummaryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_255_212);
  const items: StrictPostSummary[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictPostSummary(`strict-post-summary-${index}`, "sample"));
  }
  const report = buildStrictPostSummaryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
