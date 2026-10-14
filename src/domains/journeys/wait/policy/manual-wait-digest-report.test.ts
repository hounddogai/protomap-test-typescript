import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualWaitDigestReport } from "./manual-wait-digest-report.js";
import { ManualWaitDigest, newManualWaitDigest } from "./manual-wait-digest.js";

test("ManualWaitDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_233_438);
  const items: ManualWaitDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualWaitDigest(`manual-wait-digest-${index}`, "sample"));
  }
  const report = buildManualWaitDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
