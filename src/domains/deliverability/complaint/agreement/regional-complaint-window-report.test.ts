import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalComplaintWindowReport } from "./regional-complaint-window-report.js";
import { RegionalComplaintWindow, newRegionalComplaintWindow } from "./regional-complaint-window.js";

test("RegionalComplaintWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_860_519);
  const items: RegionalComplaintWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalComplaintWindow(`regional-complaint-window-${index}`, "sample"));
  }
  const report = buildRegionalComplaintWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
