import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryTicketViewCheckpointReport } from "./primary-ticket-view-checkpoint-report.js";
import { PrimaryTicketViewCheckpoint, newPrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

test("PrimaryTicketViewCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_146_004);
  const items: PrimaryTicketViewCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryTicketViewCheckpoint(`primary-ticket-view-checkpoint-${index}`, "sample"));
  }
  const report = buildPrimaryTicketViewCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
