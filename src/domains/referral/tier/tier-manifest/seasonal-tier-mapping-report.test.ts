import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalTierMappingReport } from "./seasonal-tier-mapping-report.js";
import { SeasonalTierMapping, newSeasonalTierMapping } from "./seasonal-tier-mapping.js";

test("SeasonalTierMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_581_193);
  const items: SeasonalTierMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalTierMapping(`seasonal-tier-mapping-${index}`, "sample"));
  }
  const report = buildSeasonalTierMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
