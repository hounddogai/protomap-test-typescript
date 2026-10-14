import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedPathSnapshotReport } from "./capped-path-snapshot-report.js";
import { CappedPathSnapshot, newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("CappedPathSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_356_731);
  const items: CappedPathSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedPathSnapshot(`capped-path-snapshot-${index}`, "sample"));
  }
  const report = buildCappedPathSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
