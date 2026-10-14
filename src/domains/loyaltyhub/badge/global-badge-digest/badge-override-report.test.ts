import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeOverrideReport } from "./badge-override-report.js";
import { BadgeOverride, newBadgeOverride } from "./badge-override.js";

test("BadgeOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_233_841);
  const items: BadgeOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBadgeOverride(`badge-override-${index}`, "sample"));
  }
  const report = buildBadgeOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
