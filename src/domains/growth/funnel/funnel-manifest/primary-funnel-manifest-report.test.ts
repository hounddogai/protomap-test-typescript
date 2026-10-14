import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryFunnelManifestReport } from "./primary-funnel-manifest-report.js";
import { PrimaryFunnelManifest, newPrimaryFunnelManifest } from "./primary-funnel-manifest.js";

test("PrimaryFunnelManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_669_589);
  const items: PrimaryFunnelManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryFunnelManifest(`primary-funnel-manifest-${index}`, "sample"));
  }
  const report = buildPrimaryFunnelManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
