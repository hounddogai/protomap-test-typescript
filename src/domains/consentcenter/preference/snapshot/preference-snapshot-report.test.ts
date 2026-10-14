import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceSnapshotReport } from "./preference-snapshot-report.js";
import { PreferenceSnapshot, newPreferenceSnapshot } from "./preference-snapshot.js";

test("PreferenceSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_607_226);
  const items: PreferenceSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPreferenceSnapshot(`preference-snapshot-${index}`, "sample"));
  }
  const report = buildPreferenceSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
