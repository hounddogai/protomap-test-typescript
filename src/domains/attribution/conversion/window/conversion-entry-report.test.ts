import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionEntryReport } from "./conversion-entry-report.js";
import { ConversionEntry, newConversionEntry } from "./conversion-entry.js";

test("ConversionEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_761_188);
  const items: ConversionEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newConversionEntry(`conversion-entry-${index}`, "sample"));
  }
  const report = buildConversionEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
