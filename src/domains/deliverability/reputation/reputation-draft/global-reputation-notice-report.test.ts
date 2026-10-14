import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalReputationNoticeReport } from "./global-reputation-notice-report.js";
import { GlobalReputationNotice, newGlobalReputationNotice } from "./global-reputation-notice.js";

test("GlobalReputationNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_382_886);
  const items: GlobalReputationNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalReputationNotice(`global-reputation-notice-${index}`, "sample"));
  }
  const report = buildGlobalReputationNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
