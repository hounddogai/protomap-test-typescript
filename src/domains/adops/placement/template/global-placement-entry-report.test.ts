import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalPlacementEntryReport } from "./global-placement-entry-report.js";
import { GlobalPlacementEntry, newGlobalPlacementEntry } from "./global-placement-entry.js";

test("GlobalPlacementEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_957_142);
  const items: GlobalPlacementEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalPlacementEntry(`global-placement-entry-${index}`, "sample"));
  }
  const report = buildGlobalPlacementEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
