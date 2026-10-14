import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalDomainGroupReport } from "./seasonal-domain-group-report.js";
import { SeasonalDomainGroup, newSeasonalDomainGroup } from "./seasonal-domain-group.js";

test("SeasonalDomainGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_693_667);
  const items: SeasonalDomainGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalDomainGroup(`seasonal-domain-group-${index}`, "sample"));
  }
  const report = buildSeasonalDomainGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
