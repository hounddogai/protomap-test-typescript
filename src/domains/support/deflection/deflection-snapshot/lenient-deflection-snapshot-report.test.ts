import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientDeflectionSnapshotReport } from "./lenient-deflection-snapshot-report.js";
import { LenientDeflectionSnapshot, newLenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

test("LenientDeflectionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_354_695);
  const items: LenientDeflectionSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientDeflectionSnapshot(`lenient-deflection-snapshot-${index}`, "sample"));
  }
  const report = buildLenientDeflectionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
