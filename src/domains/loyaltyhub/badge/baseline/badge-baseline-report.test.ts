import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeBaselineReport } from "./badge-baseline-report.js";
import { BadgeBaseline, newBadgeBaseline } from "./badge-baseline.js";

test("BadgeBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_666_938);
  const items: BadgeBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBadgeBaseline(`badge-baseline-${index}`, "sample"));
  }
  const report = buildBadgeBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
