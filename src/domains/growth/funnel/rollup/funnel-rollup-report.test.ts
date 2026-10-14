import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelRollupReport } from "./funnel-rollup-report.js";
import { FunnelRollup, newFunnelRollup } from "./funnel-rollup.js";

test("FunnelRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_153_337);
  const items: FunnelRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFunnelRollup(`funnel-rollup-${index}`, "sample"));
  }
  const report = buildFunnelRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
