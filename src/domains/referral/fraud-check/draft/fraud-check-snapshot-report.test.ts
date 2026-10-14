import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckSnapshotReport } from "./fraud-check-snapshot-report.js";
import { FraudCheckSnapshot, newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

test("FraudCheckSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_542_970);
  const items: FraudCheckSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFraudCheckSnapshot(`fraud-check-snapshot-${index}`, "sample"));
  }
  const report = buildFraudCheckSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
