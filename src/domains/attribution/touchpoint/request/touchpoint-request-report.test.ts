import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointRequestReport } from "./touchpoint-request-report.js";
import { TouchpointRequest, newTouchpointRequest } from "./touchpoint-request.js";

test("TouchpointRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_347_734);
  const items: TouchpointRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTouchpointRequest(`touchpoint-request-${index}`, "sample"));
  }
  const report = buildTouchpointRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
