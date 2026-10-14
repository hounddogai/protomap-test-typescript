import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathEntryReport } from "./path-entry-report.js";
import { PathEntry, newPathEntry } from "./path-entry.js";

test("PathEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_089_430);
  const items: PathEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPathEntry(`path-entry-${index}`, "sample"));
  }
  const report = buildPathEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
