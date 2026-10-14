import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedDoubleOptInBundleReport } from "./capped-double-opt-in-bundle-report.js";
import { CappedDoubleOptInBundle, newCappedDoubleOptInBundle } from "./capped-double-opt-in-bundle.js";

test("CappedDoubleOptInBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_556_293);
  const items: CappedDoubleOptInBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedDoubleOptInBundle(`capped-double-opt-in-bundle-${index}`, "sample"));
  }
  const report = buildCappedDoubleOptInBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
