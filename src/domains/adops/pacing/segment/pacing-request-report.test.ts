import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingRequestReport } from "./pacing-request-report.js";
import { PacingRequest, newPacingRequest } from "./pacing-request.js";

test("PacingRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_301_842);
  const items: PacingRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPacingRequest(`pacing-request-${index}`, "sample"));
  }
  const report = buildPacingRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
