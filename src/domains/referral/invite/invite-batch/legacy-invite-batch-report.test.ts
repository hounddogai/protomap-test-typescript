import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyInviteBatchReport } from "./legacy-invite-batch-report.js";
import { LegacyInviteBatch, newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("LegacyInviteBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_277_834);
  const items: LegacyInviteBatch[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyInviteBatch(`legacy-invite-batch-${index}`, "sample"));
  }
  const report = buildLegacyInviteBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
