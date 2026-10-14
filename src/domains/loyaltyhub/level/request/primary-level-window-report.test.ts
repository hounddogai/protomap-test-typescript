import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryLevelWindowReport } from "./primary-level-window-report.js";
import { PrimaryLevelWindow, newPrimaryLevelWindow } from "./primary-level-window.js";

test("PrimaryLevelWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_406_887);
  const items: PrimaryLevelWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryLevelWindow(`primary-level-window-${index}`, "sample"));
  }
  const report = buildPrimaryLevelWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
