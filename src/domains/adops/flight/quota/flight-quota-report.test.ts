import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightQuotaReport } from "./flight-quota-report.js";
import { FlightQuota, newFlightQuota } from "./flight-quota.js";

test("FlightQuotaReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_025_566);
  const items: FlightQuota[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFlightQuota(`flight-quota-${index}`, "sample"));
  }
  const report = buildFlightQuotaReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
