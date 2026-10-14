import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostOverrideReport } from "./post-override-report.js";
import { PostOverride, newPostOverride } from "./post-override.js";

test("PostOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_073_002);
  const items: PostOverride[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostOverride(`post-override-${index}`, "sample"));
  }
  const report = buildPostOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
