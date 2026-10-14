import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowMappingReport } from "./window-mapping-report.js";
import { WindowMapping, newWindowMapping } from "./window-mapping.js";

test("WindowMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_354_299);
  const items: WindowMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWindowMapping(`window-mapping-${index}`, "sample"));
  }
  const report = buildWindowMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
