import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointSnapshotReport } from "./touchpoint-snapshot-report.js";
import { TouchpointSnapshot, newTouchpointSnapshot } from "./touchpoint-snapshot.js";

test("TouchpointSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_254_660);
  const items: TouchpointSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTouchpointSnapshot(`touchpoint-snapshot-${index}`, "sample"));
  }
  const report = buildTouchpointSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
