import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTicketViewNoticeReport } from "./ticket-view-notice-report.js";
import { TicketViewNotice, newTicketViewNotice } from "./ticket-view-notice.js";

test("TicketViewNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_899_234);
  const items: TicketViewNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTicketViewNotice(`ticket-view-notice-${index}`, "sample"));
  }
  const report = buildTicketViewNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
