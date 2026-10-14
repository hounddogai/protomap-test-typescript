import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeNoticeReport } from "./creative-notice-report.js";
import { CreativeNotice, newCreativeNotice } from "./creative-notice.js";

test("CreativeNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_522_062);
  const items: CreativeNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCreativeNotice(`creative-notice-${index}`, "sample"));
  }
  const report = buildCreativeNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
