import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledMacroSnapshotReport } from "./scheduled-macro-snapshot-report.js";
import { ScheduledMacroSnapshot, newScheduledMacroSnapshot } from "./scheduled-macro-snapshot.js";

test("ScheduledMacroSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_924_799);
  const items: ScheduledMacroSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledMacroSnapshot(`scheduled-macro-snapshot-${index}`, "sample"));
  }
  const report = buildScheduledMacroSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
