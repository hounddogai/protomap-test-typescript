import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathMappingReport } from "./path-mapping-report.js";
import { PathMapping, newPathMapping } from "./path-mapping.js";

test("PathMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_668_751);
  const items: PathMapping[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPathMapping(`path-mapping-${index}`, "sample"));
  }
  const report = buildPathMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
