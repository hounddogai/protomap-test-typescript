import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPostOverrideReport } from "./default-post-override-report.js";
import { DefaultPostOverride, newDefaultPostOverride } from "./default-post-override.js";

test("DefaultPostOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_645_038);
  const items: DefaultPostOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultPostOverride(`default-post-override-${index}`, "sample"));
  }
  const report = buildDefaultPostOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
