import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderPreferenceReport } from "./sender-preference-report.js";
import { SenderPreference, newSenderPreference } from "./sender-preference.js";

test("SenderPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_253_840);
  const items: SenderPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSenderPreference(`sender-preference-${index}`, "sample"));
  }
  const report = buildSenderPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
