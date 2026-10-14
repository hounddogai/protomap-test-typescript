import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionPreferenceReport } from "./suppression-preference-report.js";
import { SuppressionPreference, newSuppressionPreference } from "./suppression-preference.js";

test("SuppressionPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_826_683);
  const items: SuppressionPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSuppressionPreference(`suppression-preference-${index}`, "sample"));
  }
  const report = buildSuppressionPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
