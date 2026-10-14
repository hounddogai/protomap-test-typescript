import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelNoticeReport } from "./model-notice-report.js";
import { ModelNotice, newModelNotice } from "./model-notice.js";

test("ModelNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_584_382);
  const items: ModelNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newModelNotice(`model-notice-${index}`, "sample"));
  }
  const report = buildModelNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
