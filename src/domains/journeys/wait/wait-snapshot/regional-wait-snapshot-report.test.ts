import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalWaitSnapshotReport } from "./regional-wait-snapshot-report.js";
import { RegionalWaitSnapshot, newRegionalWaitSnapshot } from "./regional-wait-snapshot.js";

test("RegionalWaitSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_629_037);
  const items: RegionalWaitSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalWaitSnapshot(`regional-wait-snapshot-${index}`, "sample"));
  }
  const report = buildRegionalWaitSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
