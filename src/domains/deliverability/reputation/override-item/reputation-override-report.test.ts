import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationOverrideReport } from "./reputation-override-report.js";
import { ReputationOverride, newReputationOverride } from "./reputation-override.js";

test("ReputationOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_413_868);
  const items: ReputationOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReputationOverride(`reputation-override-${index}`, "sample"));
  }
  const report = buildReputationOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
