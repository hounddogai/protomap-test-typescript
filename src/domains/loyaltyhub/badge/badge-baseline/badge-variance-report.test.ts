import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeVarianceReport } from "./badge-variance-report.js";
import { BadgeVariance, newBadgeVariance } from "./badge-variance.js";

test("BadgeVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_676_059);
  const items: BadgeVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBadgeVariance(`badge-variance-${index}`, "sample"));
  }
  const report = buildBadgeVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
