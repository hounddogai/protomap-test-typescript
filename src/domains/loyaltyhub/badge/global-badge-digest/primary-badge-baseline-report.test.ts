import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBadgeBaselineReport } from "./primary-badge-baseline-report.js";
import { PrimaryBadgeBaseline, newPrimaryBadgeBaseline } from "./primary-badge-baseline.js";

test("PrimaryBadgeBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_750_140);
  const items: PrimaryBadgeBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryBadgeBaseline(`primary-badge-baseline-${index}`, "sample"));
  }
  const report = buildPrimaryBadgeBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
