import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionBaselineReport } from "./retention-baseline-report.js";
import { RetentionBaseline, newRetentionBaseline } from "./retention-baseline.js";

test("RetentionBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_206_862);
  const items: RetentionBaseline[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRetentionBaseline(`retention-baseline-${index}`, "sample"));
  }
  const report = buildRetentionBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
