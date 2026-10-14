import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalNudgeSnapshotReport } from "./regional-nudge-snapshot-report.js";
import { RegionalNudgeSnapshot, newRegionalNudgeSnapshot } from "./regional-nudge-snapshot.js";

test("RegionalNudgeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_771_085);
  const items: RegionalNudgeSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalNudgeSnapshot(`regional-nudge-snapshot-${index}`, "sample"));
  }
  const report = buildRegionalNudgeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
