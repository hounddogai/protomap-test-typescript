import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalModelEntryReport } from "./regional-model-entry-report.js";
import { RegionalModelEntry, newRegionalModelEntry } from "./regional-model-entry.js";

test("RegionalModelEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_941_887);
  const items: RegionalModelEntry[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalModelEntry(`regional-model-entry-${index}`, "sample"));
  }
  const report = buildRegionalModelEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
