import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPostSnapshotReport } from "./lenient-post-snapshot-report.js";
import { LenientPostSnapshot, newLenientPostSnapshot } from "./lenient-post-snapshot.js";

test("LenientPostSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_341_229);
  const items: LenientPostSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientPostSnapshot(`lenient-post-snapshot-${index}`, "sample"));
  }
  const report = buildLenientPostSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
