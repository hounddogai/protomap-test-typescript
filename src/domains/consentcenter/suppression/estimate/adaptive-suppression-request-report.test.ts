import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSuppressionRequestReport } from "./adaptive-suppression-request-report.js";
import { AdaptiveSuppressionRequest, newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("AdaptiveSuppressionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_516_716);
  const items: AdaptiveSuppressionRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptiveSuppressionRequest(`adaptive-suppression-request-${index}`, "sample"));
  }
  const report = buildAdaptiveSuppressionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
