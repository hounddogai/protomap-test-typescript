import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueManifestReport } from "./queue-manifest-report.js";
import { QueueManifest, newQueueManifest } from "./queue-manifest.js";

test("QueueManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_003_155);
  const items: QueueManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueManifest(`queue-manifest-${index}`, "sample"));
  }
  const report = buildQueueManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
