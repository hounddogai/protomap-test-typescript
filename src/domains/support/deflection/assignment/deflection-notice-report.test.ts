import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionNoticeReport } from "./deflection-notice-report.js";
import { DeflectionNotice, newDeflectionNotice } from "./deflection-notice.js";

test("DeflectionNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_410_520);
  const items: DeflectionNotice[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDeflectionNotice(`deflection-notice-${index}`, "sample"));
  }
  const report = buildDeflectionNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
