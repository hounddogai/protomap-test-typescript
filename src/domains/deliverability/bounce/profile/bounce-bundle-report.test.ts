import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceBundleReport } from "./bounce-bundle-report.js";
import { BounceBundle, newBounceBundle } from "./bounce-bundle.js";

test("BounceBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_133_191);
  const items: BounceBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBounceBundle(`bounce-bundle-${index}`, "sample"));
  }
  const report = buildBounceBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
