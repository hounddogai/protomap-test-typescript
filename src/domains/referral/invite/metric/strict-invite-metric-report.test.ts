import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictInviteMetricReport } from "./strict-invite-metric-report.js";
import { StrictInviteMetric, newStrictInviteMetric } from "./strict-invite-metric.js";

test("StrictInviteMetricReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_439_104);
  const items: StrictInviteMetric[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictInviteMetric(`strict-invite-metric-${index}`, "sample"));
  }
  const report = buildStrictInviteMetricReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
