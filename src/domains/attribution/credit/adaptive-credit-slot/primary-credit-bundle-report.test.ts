import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryCreditBundleReport } from "./primary-credit-bundle-report.js";
import { PrimaryCreditBundle, newPrimaryCreditBundle } from "./primary-credit-bundle.js";

test("PrimaryCreditBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_209_512);
  const items: PrimaryCreditBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryCreditBundle(`primary-credit-bundle-${index}`, "sample"));
  }
  const report = buildPrimaryCreditBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
