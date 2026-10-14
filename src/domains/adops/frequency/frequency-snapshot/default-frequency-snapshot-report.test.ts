import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFrequencySnapshotReport } from "./default-frequency-snapshot-report.js";
import { DefaultFrequencySnapshot, newDefaultFrequencySnapshot } from "./default-frequency-snapshot.js";

test("DefaultFrequencySnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_936_604);
  const items: DefaultFrequencySnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultFrequencySnapshot(`default-frequency-snapshot-${index}`, "sample"));
  }
  const report = buildDefaultFrequencySnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
