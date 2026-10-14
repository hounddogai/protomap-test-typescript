import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyEntryReport } from "./journey-entry-report.js";
import { JourneyEntry, newJourneyEntry } from "./journey-entry.js";

test("JourneyEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_807_886);
  const items: JourneyEntry[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newJourneyEntry(`journey-entry-${index}`, "sample"));
  }
  const report = buildJourneyEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
