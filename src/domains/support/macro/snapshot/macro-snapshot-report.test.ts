import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroSnapshotReport } from "./macro-snapshot-report.js";
import { MacroSnapshot, newMacroSnapshot } from "./macro-snapshot.js";

test("MacroSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_082_025);
  const items: MacroSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newMacroSnapshot(`macro-snapshot-${index}`, "sample"));
  }
  const report = buildMacroSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
