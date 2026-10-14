import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredDeflectionManifestReport } from "./tiered-deflection-manifest-report.js";
import { TieredDeflectionManifest, newTieredDeflectionManifest } from "./tiered-deflection-manifest.js";

test("TieredDeflectionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_079_203);
  const items: TieredDeflectionManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredDeflectionManifest(`tiered-deflection-manifest-${index}`, "sample"));
  }
  const report = buildTieredDeflectionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
