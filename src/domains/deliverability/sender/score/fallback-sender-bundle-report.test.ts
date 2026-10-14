import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSenderBundleReport } from "./fallback-sender-bundle-report.js";
import { FallbackSenderBundle, newFallbackSenderBundle } from "./fallback-sender-bundle.js";

test("FallbackSenderBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_940_243);
  const items: FallbackSenderBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackSenderBundle(`fallback-sender-bundle-${index}`, "sample"));
  }
  const report = buildFallbackSenderBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
