import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryConversionSnapshotReport } from "./primary-conversion-snapshot-report.js";
import { PrimaryConversionSnapshot, newPrimaryConversionSnapshot } from "./primary-conversion-snapshot.js";

test("PrimaryConversionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_618_645);
  const items: PrimaryConversionSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryConversionSnapshot(`primary-conversion-snapshot-${index}`, "sample"));
  }
  const report = buildPrimaryConversionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
