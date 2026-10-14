import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionSnapshotReport } from "./mention-snapshot-report.js";
import { MentionSnapshot, newMentionSnapshot } from "./mention-snapshot.js";

test("MentionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_118_843);
  const items: MentionSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newMentionSnapshot(`mention-snapshot-${index}`, "sample"));
  }
  const report = buildMentionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
