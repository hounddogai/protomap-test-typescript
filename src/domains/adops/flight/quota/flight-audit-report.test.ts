import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFlightAuditReport } from "./flight-audit-report.js";
import { FlightAudit, newFlightAudit } from "./flight-audit.js";

test("FlightAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_849_273);
  const items: FlightAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFlightAudit(`flight-audit-${index}`, "sample"));
  }
  const report = buildFlightAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
