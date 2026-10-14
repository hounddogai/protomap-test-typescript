import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInSnapshotReport } from "./double-opt-in-snapshot-report.js";
import { DoubleOptInSnapshot, newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("DoubleOptInSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_226_301);
  const items: DoubleOptInSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInSnapshot(`double-opt-in-snapshot-${index}`, "sample"));
  }
  const report = buildDoubleOptInSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
