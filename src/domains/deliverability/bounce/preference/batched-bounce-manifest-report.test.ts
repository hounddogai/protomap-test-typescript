import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedBounceManifestReport } from "./batched-bounce-manifest-report.js";
import { BatchedBounceManifest, newBatchedBounceManifest } from "./batched-bounce-manifest.js";

test("BatchedBounceManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_995_776);
  const items: BatchedBounceManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedBounceManifest(`batched-bounce-manifest-${index}`, "sample"));
  }
  const report = buildBatchedBounceManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
