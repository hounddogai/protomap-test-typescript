import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionSnapshotReport } from "./suppression-snapshot-report.js";
import { SuppressionSnapshot, newSuppressionSnapshot } from "./suppression-snapshot.js";

test("SuppressionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_791_318);
  const items: SuppressionSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSuppressionSnapshot(`suppression-snapshot-${index}`, "sample"));
  }
  const report = buildSuppressionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
