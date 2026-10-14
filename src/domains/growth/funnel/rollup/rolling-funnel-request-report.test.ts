import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingFunnelRequestReport } from "./rolling-funnel-request-report.js";
import { RollingFunnelRequest, newRollingFunnelRequest } from "./rolling-funnel-request.js";

test("RollingFunnelRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_626_485);
  const items: RollingFunnelRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingFunnelRequest(`rolling-funnel-request-${index}`, "sample"));
  }
  const report = buildRollingFunnelRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
