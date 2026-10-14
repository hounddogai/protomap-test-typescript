import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementNoticeReport } from "./placement-notice-report.js";
import { PlacementNotice, newPlacementNotice } from "./placement-notice.js";

test("PlacementNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_325_955);
  const items: PlacementNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPlacementNotice(`placement-notice-${index}`, "sample"));
  }
  const report = buildPlacementNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
