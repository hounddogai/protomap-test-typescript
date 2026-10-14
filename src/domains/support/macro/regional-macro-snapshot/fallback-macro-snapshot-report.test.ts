import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackMacroSnapshotReport } from "./fallback-macro-snapshot-report.js";
import { FallbackMacroSnapshot, newFallbackMacroSnapshot } from "./fallback-macro-snapshot.js";

test("FallbackMacroSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_947_751);
  const items: FallbackMacroSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackMacroSnapshot(`fallback-macro-snapshot-${index}`, "sample"));
  }
  const report = buildFallbackMacroSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
