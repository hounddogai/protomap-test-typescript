import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedCsatManifestReport } from "./capped-csat-manifest-report.js";
import { CappedCsatManifest, newCappedCsatManifest } from "./capped-csat-manifest.js";

test("CappedCsatManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_119_568);
  const items: CappedCsatManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedCsatManifest(`capped-csat-manifest-${index}`, "sample"));
  }
  const report = buildCappedCsatManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
