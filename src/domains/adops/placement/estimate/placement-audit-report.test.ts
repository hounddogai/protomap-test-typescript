import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementAuditReport } from "./placement-audit-report.js";
import { PlacementAudit, newPlacementAudit } from "./placement-audit.js";

test("PlacementAuditReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_489_563);
  const items: PlacementAudit[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPlacementAudit(`placement-audit-${index}`, "sample"));
  }
  const report = buildPlacementAuditReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
