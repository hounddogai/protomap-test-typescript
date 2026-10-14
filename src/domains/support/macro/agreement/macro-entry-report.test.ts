import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroEntryReport } from "./macro-entry-report.js";
import { MacroEntry, newMacroEntry } from "./macro-entry.js";

test("MacroEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_784_925);
  const items: MacroEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newMacroEntry(`macro-entry-${index}`, "sample"));
  }
  const report = buildMacroEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
