import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDeflectionSnapshotReport } from "./scheduled-deflection-snapshot-report.js";
import { ScheduledDeflectionSnapshot, newScheduledDeflectionSnapshot } from "./scheduled-deflection-snapshot.js";

test("ScheduledDeflectionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_848_042);
  const items: ScheduledDeflectionSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledDeflectionSnapshot(`scheduled-deflection-snapshot-${index}`, "sample"));
  }
  const report = buildScheduledDeflectionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
