import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultConversionSnapshotReport } from "./default-conversion-snapshot-report.js";
import { DefaultConversionSnapshot, newDefaultConversionSnapshot } from "./default-conversion-snapshot.js";

test("DefaultConversionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_438_108);
  const items: DefaultConversionSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultConversionSnapshot(`default-conversion-snapshot-${index}`, "sample"));
  }
  const report = buildDefaultConversionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
