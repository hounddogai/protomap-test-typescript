import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionRequestReport } from "./retention-request-report.js";
import { RetentionRequest, newRetentionRequest } from "./retention-request.js";

test("RetentionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_614_696);
  const items: RetentionRequest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRetentionRequest(`retention-request-${index}`, "sample"));
  }
  const report = buildRetentionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
