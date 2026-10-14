import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalRedemptionEntryReport } from "./regional-redemption-entry-report.js";
import { RegionalRedemptionEntry, newRegionalRedemptionEntry } from "./regional-redemption-entry.js";

test("RegionalRedemptionEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_464_735);
  const items: RegionalRedemptionEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalRedemptionEntry(`regional-redemption-entry-${index}`, "sample"));
  }
  const report = buildRegionalRedemptionEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
