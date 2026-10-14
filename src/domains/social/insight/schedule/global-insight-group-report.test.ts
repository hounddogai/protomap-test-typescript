import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalInsightGroupReport } from "./global-insight-group-report.js";
import { GlobalInsightGroup, newGlobalInsightGroup } from "./global-insight-group.js";

test("GlobalInsightGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_977_886);
  const items: GlobalInsightGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalInsightGroup(`global-insight-group-${index}`, "sample"));
  }
  const report = buildGlobalInsightGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
