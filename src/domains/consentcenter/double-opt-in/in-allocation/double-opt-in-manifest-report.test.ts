import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInManifestReport } from "./double-opt-in-manifest-report.js";
import { DoubleOptInManifest, newDoubleOptInManifest } from "./double-opt-in-manifest.js";

test("DoubleOptInManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_273_285);
  const items: DoubleOptInManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDoubleOptInManifest(`double-opt-in-manifest-${index}`, "sample"));
  }
  const report = buildDoubleOptInManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
