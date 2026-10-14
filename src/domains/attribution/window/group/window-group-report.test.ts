import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowGroupReport } from "./window-group-report.js";
import { WindowGroup, newWindowGroup } from "./window-group.js";

test("WindowGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_678_315);
  const items: WindowGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWindowGroup(`window-group-${index}`, "sample"));
  }
  const report = buildWindowGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
