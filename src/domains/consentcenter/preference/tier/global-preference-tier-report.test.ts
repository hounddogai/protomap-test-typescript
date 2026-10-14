import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalPreferenceTierReport } from "./global-preference-tier-report.js";
import { GlobalPreferenceTier, newGlobalPreferenceTier } from "./global-preference-tier.js";

test("GlobalPreferenceTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_544_949);
  const items: GlobalPreferenceTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalPreferenceTier(`global-preference-tier-${index}`, "sample"));
  }
  const report = buildGlobalPreferenceTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
