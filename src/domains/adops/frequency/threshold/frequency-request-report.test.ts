import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyRequestReport } from "./frequency-request-report.js";
import { FrequencyRequest, newFrequencyRequest } from "./frequency-request.js";

test("FrequencyRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_118_215);
  const items: FrequencyRequest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newFrequencyRequest(`frequency-request-${index}`, "sample"));
  }
  const report = buildFrequencyRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
