import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceExceptionReport } from "./preference-exception-report.js";
import { PreferenceException, newPreferenceException } from "./preference-exception.js";

test("PreferenceExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_183_695);
  const items: PreferenceException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPreferenceException(`preference-exception-${index}`, "sample"));
  }
  const report = buildPreferenceExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
