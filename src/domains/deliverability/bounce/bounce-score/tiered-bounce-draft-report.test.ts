import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBounceDraftReport } from "./tiered-bounce-draft-report.js";
import { TieredBounceDraft, newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("TieredBounceDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_967_575);
  const items: TieredBounceDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredBounceDraft(`tiered-bounce-draft-${index}`, "sample"));
  }
  const report = buildTieredBounceDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
