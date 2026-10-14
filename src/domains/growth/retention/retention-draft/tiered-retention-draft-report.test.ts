import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredRetentionDraftReport } from "./tiered-retention-draft-report.js";
import { TieredRetentionDraft, newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("TieredRetentionDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_269_423);
  const items: TieredRetentionDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredRetentionDraft(`tiered-retention-draft-${index}`, "sample"));
  }
  const report = buildTieredRetentionDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
