import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingModelRequestReport } from "./pending-model-request-report.js";
import { PendingModelRequest, newPendingModelRequest } from "./pending-model-request.js";

test("PendingModelRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_868_833);
  const items: PendingModelRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPendingModelRequest(`pending-model-request-${index}`, "sample"));
  }
  const report = buildPendingModelRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
