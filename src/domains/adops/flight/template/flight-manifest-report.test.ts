import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightManifestReport } from "./flight-manifest-report.js";
import { FlightManifest, newFlightManifest } from "./flight-manifest.js";

test("FlightManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_341_316);
  const items: FlightManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFlightManifest(`flight-manifest-${index}`, "sample"));
  }
  const report = buildFlightManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
