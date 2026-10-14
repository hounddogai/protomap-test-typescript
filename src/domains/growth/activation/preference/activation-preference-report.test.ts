import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationPreferenceReport } from "./activation-preference-report.js";
import { ActivationPreference, newActivationPreference } from "./activation-preference.js";

test("ActivationPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_203_951);
  const items: ActivationPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newActivationPreference(`activation-preference-${index}`, "sample"));
  }
  const report = buildActivationPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
