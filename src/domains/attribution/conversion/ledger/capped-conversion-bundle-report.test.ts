import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedConversionBundleReport } from "./capped-conversion-bundle-report.js";
import { CappedConversionBundle, newCappedConversionBundle } from "./capped-conversion-bundle.js";

test("CappedConversionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_956_416);
  const items: CappedConversionBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedConversionBundle(`capped-conversion-bundle-${index}`, "sample"));
  }
  const report = buildCappedConversionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
