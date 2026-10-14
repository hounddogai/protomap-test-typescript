import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyFunnelOverrideReport } from "./legacy-funnel-override-report.js";
import { LegacyFunnelOverride, newLegacyFunnelOverride } from "./legacy-funnel-override.js";

test("LegacyFunnelOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_840_401);
  const items: LegacyFunnelOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyFunnelOverride(`legacy-funnel-override-${index}`, "sample"));
  }
  const report = buildLegacyFunnelOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
