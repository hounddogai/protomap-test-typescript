import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPayoutOverrideReport } from "./default-payout-override-report.js";
import { DefaultPayoutOverride, newDefaultPayoutOverride } from "./default-payout-override.js";

test("DefaultPayoutOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_527_654);
  const items: DefaultPayoutOverride[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultPayoutOverride(`default-payout-override-${index}`, "sample"));
  }
  const report = buildDefaultPayoutOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
