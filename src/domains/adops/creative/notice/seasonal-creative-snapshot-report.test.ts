import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreativeSnapshotReport } from "./seasonal-creative-snapshot-report.js";
import { SeasonalCreativeSnapshot, newSeasonalCreativeSnapshot } from "./seasonal-creative-snapshot.js";

test("SeasonalCreativeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_437_092);
  const items: SeasonalCreativeSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalCreativeSnapshot(`seasonal-creative-snapshot-${index}`, "sample"));
  }
  const report = buildSeasonalCreativeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
