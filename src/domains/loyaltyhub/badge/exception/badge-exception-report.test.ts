import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeExceptionReport } from "./badge-exception-report.js";
import { BadgeException, newBadgeException } from "./badge-exception.js";

test("BadgeExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_210_756);
  const items: BadgeException[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBadgeException(`badge-exception-${index}`, "sample"));
  }
  const report = buildBadgeExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
