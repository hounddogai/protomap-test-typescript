import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBounceOverrideReport } from "./tiered-bounce-override-report.js";
import { TieredBounceOverride, newTieredBounceOverride } from "./tiered-bounce-override.js";

test("TieredBounceOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_163_529);
  const items: TieredBounceOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredBounceOverride(`tiered-bounce-override-${index}`, "sample"));
  }
  const report = buildTieredBounceOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
