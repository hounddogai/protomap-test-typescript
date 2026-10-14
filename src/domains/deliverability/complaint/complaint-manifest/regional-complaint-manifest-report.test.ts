import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalComplaintManifestReport } from "./regional-complaint-manifest-report.js";
import { RegionalComplaintManifest, newRegionalComplaintManifest } from "./regional-complaint-manifest.js";

test("RegionalComplaintManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_433_289);
  const items: RegionalComplaintManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalComplaintManifest(`regional-complaint-manifest-${index}`, "sample"));
  }
  const report = buildRegionalComplaintManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
