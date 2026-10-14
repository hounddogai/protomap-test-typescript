import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDomainSnapshotReport } from "./weighted-domain-snapshot-report.js";
import { WeightedDomainSnapshot, newWeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

test("WeightedDomainSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_967_909);
  const items: WeightedDomainSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedDomainSnapshot(`weighted-domain-snapshot-${index}`, "sample"));
  }
  const report = buildWeightedDomainSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
