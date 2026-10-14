import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPacingBundleReport } from "./strict-pacing-bundle-report.js";
import { StrictPacingBundle, newStrictPacingBundle } from "./strict-pacing-bundle.js";

test("StrictPacingBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_619_512);
  const items: StrictPacingBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictPacingBundle(`strict-pacing-bundle-${index}`, "sample"));
  }
  const report = buildStrictPacingBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
