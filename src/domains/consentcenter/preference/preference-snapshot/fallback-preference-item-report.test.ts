import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackPreferenceItemReport } from "./fallback-preference-item-report.js";
import { FallbackPreferenceItem, newFallbackPreferenceItem } from "./fallback-preference-item.js";

test("FallbackPreferenceItemReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_639_620);
  const items: FallbackPreferenceItem[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackPreferenceItem(`fallback-preference-item-${index}`, "sample"));
  }
  const report = buildFallbackPreferenceItemReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
