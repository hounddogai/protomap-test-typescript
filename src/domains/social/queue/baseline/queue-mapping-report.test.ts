import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueMappingReport } from "./queue-mapping-report.js";
import { QueueMapping, newQueueMapping } from "./queue-mapping.js";

test("QueueMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_291_128);
  const items: QueueMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueMapping(`queue-mapping-${index}`, "sample"));
  }
  const report = buildQueueMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
