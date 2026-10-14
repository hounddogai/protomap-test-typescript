import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelMappingReport } from "./funnel-mapping-report.js";
import { FunnelMapping, newFunnelMapping } from "./funnel-mapping.js";

test("FunnelMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_698_699);
  const items: FunnelMapping[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFunnelMapping(`funnel-mapping-${index}`, "sample"));
  }
  const report = buildFunnelMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
