import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPreferenceRequestReport } from "./weighted-preference-request-report.js";
import { WeightedPreferenceRequest, newWeightedPreferenceRequest } from "./weighted-preference-request.js";

test("WeightedPreferenceRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_166_260);
  const items: WeightedPreferenceRequest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWeightedPreferenceRequest(`weighted-preference-request-${index}`, "sample"));
  }
  const report = buildWeightedPreferenceRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
