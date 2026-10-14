import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyQueuePolicyReport } from "./legacy-queue-policy-report.js";
import { LegacyQueuePolicy, newLegacyQueuePolicy } from "./legacy-queue-policy.js";

test("LegacyQueuePolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_178_296);
  const items: LegacyQueuePolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyQueuePolicy(`legacy-queue-policy-${index}`, "sample"));
  }
  const report = buildLegacyQueuePolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
