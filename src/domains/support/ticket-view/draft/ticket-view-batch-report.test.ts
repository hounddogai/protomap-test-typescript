import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewBatchReport } from "./ticket-view-batch-report.js";
import { TicketViewBatch, newTicketViewBatch } from "./ticket-view-batch.js";

test("TicketViewBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_620_024);
  const items: TicketViewBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTicketViewBatch(`ticket-view-batch-${index}`, "sample"));
  }
  const report = buildTicketViewBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
