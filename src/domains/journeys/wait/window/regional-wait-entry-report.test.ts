import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalWaitEntryReport } from "./regional-wait-entry-report.js";
import { RegionalWaitEntry, newRegionalWaitEntry } from "./regional-wait-entry.js";

test("RegionalWaitEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_633_989);
  const items: RegionalWaitEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalWaitEntry(`regional-wait-entry-${index}`, "sample"));
  }
  const report = buildRegionalWaitEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
