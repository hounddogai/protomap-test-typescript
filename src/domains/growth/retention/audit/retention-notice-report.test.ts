import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionNoticeReport } from "./retention-notice-report.js";
import { RetentionNotice, newRetentionNotice } from "./retention-notice.js";

test("RetentionNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_406_811);
  const items: RetentionNotice[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRetentionNotice(`retention-notice-${index}`, "sample"));
  }
  const report = buildRetentionNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
