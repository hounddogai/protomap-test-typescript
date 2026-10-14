import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalModelGroupReport } from "./regional-model-group-report.js";
import { RegionalModelGroup, newRegionalModelGroup } from "./regional-model-group.js";

test("RegionalModelGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_681_891);
  const items: RegionalModelGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalModelGroup(`regional-model-group-${index}`, "sample"));
  }
  const report = buildRegionalModelGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
