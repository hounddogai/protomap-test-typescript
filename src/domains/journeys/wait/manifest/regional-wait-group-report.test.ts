import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalWaitGroupReport } from "./regional-wait-group-report.js";
import { RegionalWaitGroup, newRegionalWaitGroup } from "./regional-wait-group.js";

test("RegionalWaitGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_576_663);
  const items: RegionalWaitGroup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalWaitGroup(`regional-wait-group-${index}`, "sample"));
  }
  const report = buildRegionalWaitGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
