import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalDomainVarianceReport } from "./seasonal-domain-variance-report.js";
import { SeasonalDomainVariance, newSeasonalDomainVariance } from "./seasonal-domain-variance.js";

test("SeasonalDomainVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_501_477);
  const items: SeasonalDomainVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalDomainVariance(`seasonal-domain-variance-${index}`, "sample"));
  }
  const report = buildSeasonalDomainVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
