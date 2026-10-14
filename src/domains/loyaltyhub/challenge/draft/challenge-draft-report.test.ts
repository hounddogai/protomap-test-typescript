import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeDraftReport } from "./challenge-draft-report.js";
import { ChallengeDraft, newChallengeDraft } from "./challenge-draft.js";

test("ChallengeDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_589_764);
  const items: ChallengeDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newChallengeDraft(`challenge-draft-${index}`, "sample"));
  }
  const report = buildChallengeDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
