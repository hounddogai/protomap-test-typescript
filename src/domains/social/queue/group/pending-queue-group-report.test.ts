import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingQueueGroupReport } from "./pending-queue-group-report.js";
import { PendingQueueGroup, newPendingQueueGroup } from "./pending-queue-group.js";

test("PendingQueueGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_977_264);
  const items: PendingQueueGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingQueueGroup(`pending-queue-group-${index}`, "sample"));
  }
  const report = buildPendingQueueGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
