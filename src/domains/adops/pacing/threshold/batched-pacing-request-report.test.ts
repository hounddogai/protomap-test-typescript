import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPacingRequestReport } from "./batched-pacing-request-report.js";
import { BatchedPacingRequest, newBatchedPacingRequest } from "./batched-pacing-request.js";

test("BatchedPacingRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_098_804);
  const items: BatchedPacingRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBatchedPacingRequest(`batched-pacing-request-${index}`, "sample"));
  }
  const report = buildBatchedPacingRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
