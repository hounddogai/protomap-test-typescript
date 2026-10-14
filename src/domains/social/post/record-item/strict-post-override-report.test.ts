import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPostOverrideReport } from "./strict-post-override-report.js";
import { StrictPostOverride, newStrictPostOverride } from "./strict-post-override.js";

test("StrictPostOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_454_692);
  const items: StrictPostOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictPostOverride(`strict-post-override-${index}`, "sample"));
  }
  const report = buildStrictPostOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
