import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedDeflectionManifestReport } from "./capped-deflection-manifest-report.js";
import { CappedDeflectionManifest, newCappedDeflectionManifest } from "./capped-deflection-manifest.js";

test("CappedDeflectionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_789_614);
  const items: CappedDeflectionManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedDeflectionManifest(`capped-deflection-manifest-${index}`, "sample"));
  }
  const report = buildCappedDeflectionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
