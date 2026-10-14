import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationBundleReport } from "./reputation-bundle-report.js";
import { ReputationBundle, newReputationBundle } from "./reputation-bundle.js";

test("ReputationBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_322_418);
  const items: ReputationBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReputationBundle(`reputation-bundle-${index}`, "sample"));
  }
  const report = buildReputationBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
