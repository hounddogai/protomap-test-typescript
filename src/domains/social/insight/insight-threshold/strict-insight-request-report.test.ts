import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictInsightRequestReport } from "./strict-insight-request-report.js";
import { StrictInsightRequest, newStrictInsightRequest } from "./strict-insight-request.js";

test("StrictInsightRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_656_010);
  const items: StrictInsightRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictInsightRequest(`strict-insight-request-${index}`, "sample"));
  }
  const report = buildStrictInsightRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
