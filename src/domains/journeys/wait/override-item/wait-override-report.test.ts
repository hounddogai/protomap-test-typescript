import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitOverrideReport } from "./wait-override-report.js";
import { WaitOverride, newWaitOverride } from "./wait-override.js";

test("WaitOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_437_321);
  const items: WaitOverride[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWaitOverride(`wait-override-${index}`, "sample"));
  }
  const report = buildWaitOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
