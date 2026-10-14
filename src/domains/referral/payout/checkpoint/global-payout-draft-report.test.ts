import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalPayoutDraftReport } from "./global-payout-draft-report.js";
import { GlobalPayoutDraft, newGlobalPayoutDraft } from "./global-payout-draft.js";

test("GlobalPayoutDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_723_283);
  const items: GlobalPayoutDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalPayoutDraft(`global-payout-draft-${index}`, "sample"));
  }
  const report = buildGlobalPayoutDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
