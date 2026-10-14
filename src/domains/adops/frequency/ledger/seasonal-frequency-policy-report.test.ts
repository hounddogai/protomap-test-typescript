import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalFrequencyPolicyReport } from "./seasonal-frequency-policy-report.js";
import { SeasonalFrequencyPolicy, newSeasonalFrequencyPolicy } from "./seasonal-frequency-policy.js";

test("SeasonalFrequencyPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_868_813);
  const items: SeasonalFrequencyPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalFrequencyPolicy(`seasonal-frequency-policy-${index}`, "sample"));
  }
  const report = buildSeasonalFrequencyPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
