import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelTargetReport } from "./funnel-target-report.js";
import { FunnelTarget, newFunnelTarget } from "./funnel-target.js";

test("FunnelTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_711_034);
  const items: FunnelTarget[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFunnelTarget(`funnel-target-${index}`, "sample"));
  }
  const report = buildFunnelTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
