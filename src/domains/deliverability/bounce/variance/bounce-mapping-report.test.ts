import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceMappingReport } from "./bounce-mapping-report.js";
import { BounceMapping, newBounceMapping } from "./bounce-mapping.js";

test("BounceMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_448_545);
  const items: BounceMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBounceMapping(`bounce-mapping-${index}`, "sample"));
  }
  const report = buildBounceMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
