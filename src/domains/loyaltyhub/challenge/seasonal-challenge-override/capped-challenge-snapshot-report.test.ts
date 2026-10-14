import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedChallengeSnapshotReport } from "./capped-challenge-snapshot-report.js";
import { CappedChallengeSnapshot, newCappedChallengeSnapshot } from "./capped-challenge-snapshot.js";

test("CappedChallengeSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_742_837);
  const items: CappedChallengeSnapshot[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedChallengeSnapshot(`capped-challenge-snapshot-${index}`, "sample"));
  }
  const report = buildCappedChallengeSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
