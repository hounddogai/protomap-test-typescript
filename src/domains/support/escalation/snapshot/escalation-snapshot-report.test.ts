import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationSnapshotReport } from "./escalation-snapshot-report.js";
import { EscalationSnapshot, newEscalationSnapshot } from "./escalation-snapshot.js";

test("EscalationSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_490_018);
  const items: EscalationSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEscalationSnapshot(`escalation-snapshot-${index}`, "sample"));
  }
  const report = buildEscalationSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
