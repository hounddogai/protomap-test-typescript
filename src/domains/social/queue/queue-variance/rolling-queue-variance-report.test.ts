import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingQueueVarianceReport } from "./rolling-queue-variance-report.js";
import { RollingQueueVariance, newRollingQueueVariance } from "./rolling-queue-variance.js";

test("RollingQueueVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_263_427);
  const items: RollingQueueVariance[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingQueueVariance(`rolling-queue-variance-${index}`, "sample"));
  }
  const report = buildRollingQueueVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
