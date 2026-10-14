import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSenderSnapshotReport } from "./regional-sender-snapshot-report.js";
import { RegionalSenderSnapshot, newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("RegionalSenderSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_953_728);
  const items: RegionalSenderSnapshot[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalSenderSnapshot(`regional-sender-snapshot-${index}`, "sample"));
  }
  const report = buildRegionalSenderSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
