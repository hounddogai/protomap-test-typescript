import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPreferencePolicyReport } from "./default-preference-policy-report.js";
import { DefaultPreferencePolicy, newDefaultPreferencePolicy } from "./default-preference-policy.js";

test("DefaultPreferencePolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_235_141);
  const items: DefaultPreferencePolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultPreferencePolicy(`default-preference-policy-${index}`, "sample"));
  }
  const report = buildDefaultPreferencePolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
