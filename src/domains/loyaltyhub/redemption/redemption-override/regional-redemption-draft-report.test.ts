import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalRedemptionDraftReport } from "./regional-redemption-draft-report.js";
import { RegionalRedemptionDraft, newRegionalRedemptionDraft } from "./regional-redemption-draft.js";

test("RegionalRedemptionDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_423_599);
  const items: RegionalRedemptionDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalRedemptionDraft(`regional-redemption-draft-${index}`, "sample"));
  }
  const report = buildRegionalRedemptionDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
