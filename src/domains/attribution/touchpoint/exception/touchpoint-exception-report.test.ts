import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointExceptionReport } from "./touchpoint-exception-report.js";
import { TouchpointException, newTouchpointException } from "./touchpoint-exception.js";

test("TouchpointExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_442_227);
  const items: TouchpointException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTouchpointException(`touchpoint-exception-${index}`, "sample"));
  }
  const report = buildTouchpointExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
