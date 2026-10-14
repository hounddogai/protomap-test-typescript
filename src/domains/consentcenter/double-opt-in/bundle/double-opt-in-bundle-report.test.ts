import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInBundleReport } from "./double-opt-in-bundle-report.js";
import { DoubleOptInBundle, newDoubleOptInBundle } from "./double-opt-in-bundle.js";

test("DoubleOptInBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_659_508);
  const items: DoubleOptInBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDoubleOptInBundle(`double-opt-in-bundle-${index}`, "sample"));
  }
  const report = buildDoubleOptInBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
