import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedTicketViewCheckpointReport } from "./capped-ticket-view-checkpoint-report.js";
import { CappedTicketViewCheckpoint, newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

test("CappedTicketViewCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_198_392);
  const items: CappedTicketViewCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedTicketViewCheckpoint(`capped-ticket-view-checkpoint-${index}`, "sample"));
  }
  const report = buildCappedTicketViewCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
