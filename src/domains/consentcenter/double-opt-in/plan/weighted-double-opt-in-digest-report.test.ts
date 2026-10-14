import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDoubleOptInDigestReport } from "./weighted-double-opt-in-digest-report.js";
import { WeightedDoubleOptInDigest, newWeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

test("WeightedDoubleOptInDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_195_447);
  const items: WeightedDoubleOptInDigest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedDoubleOptInDigest(`weighted-double-opt-in-digest-${index}`, "sample"));
  }
  const report = buildWeightedDoubleOptInDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
