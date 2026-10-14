import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientDeflectionManifestReport } from "./lenient-deflection-manifest-report.js";
import { LenientDeflectionManifest, newLenientDeflectionManifest } from "./lenient-deflection-manifest.js";

test("LenientDeflectionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_952_069);
  const items: LenientDeflectionManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientDeflectionManifest(`lenient-deflection-manifest-${index}`, "sample"));
  }
  const report = buildLenientDeflectionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
