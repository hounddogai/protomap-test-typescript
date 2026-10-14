import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredWaitManifestReport } from "./tiered-wait-manifest-report.js";
import { TieredWaitManifest, newTieredWaitManifest } from "./tiered-wait-manifest.js";

test("TieredWaitManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_487_231);
  const items: TieredWaitManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredWaitManifest(`tiered-wait-manifest-${index}`, "sample"));
  }
  const report = buildTieredWaitManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
