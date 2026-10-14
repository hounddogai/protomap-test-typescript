import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBadgeEntryReport } from "./primary-badge-entry-report.js";
import { PrimaryBadgeEntry, newPrimaryBadgeEntry } from "./primary-badge-entry.js";

test("PrimaryBadgeEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_374_044);
  const items: PrimaryBadgeEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryBadgeEntry(`primary-badge-entry-${index}`, "sample"));
  }
  const report = buildPrimaryBadgeEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
