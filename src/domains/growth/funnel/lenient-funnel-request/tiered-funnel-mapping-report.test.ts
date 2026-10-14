import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredFunnelMappingReport } from "./tiered-funnel-mapping-report.js";
import { TieredFunnelMapping, newTieredFunnelMapping } from "./tiered-funnel-mapping.js";

test("TieredFunnelMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_431_667);
  const items: TieredFunnelMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredFunnelMapping(`tiered-funnel-mapping-${index}`, "sample"));
  }
  const report = buildTieredFunnelMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
