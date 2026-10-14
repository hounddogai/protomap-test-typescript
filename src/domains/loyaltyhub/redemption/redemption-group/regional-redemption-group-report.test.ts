import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalRedemptionGroupReport } from "./regional-redemption-group-report.js";
import { RegionalRedemptionGroup, newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("RegionalRedemptionGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_542_320);
  const items: RegionalRedemptionGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalRedemptionGroup(`regional-redemption-group-${index}`, "sample"));
  }
  const report = buildRegionalRedemptionGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
