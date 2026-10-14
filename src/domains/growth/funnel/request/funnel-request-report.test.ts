import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelRequestReport } from "./funnel-request-report.js";
import { FunnelRequest, newFunnelRequest } from "./funnel-request.js";

test("FunnelRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_493_025);
  const items: FunnelRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFunnelRequest(`funnel-request-${index}`, "sample"));
  }
  const report = buildFunnelRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
