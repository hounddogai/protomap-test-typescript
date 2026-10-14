import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengePreferenceReport } from "./challenge-preference-report.js";
import { ChallengePreference, newChallengePreference } from "./challenge-preference.js";

test("ChallengePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_082_079);
  const items: ChallengePreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newChallengePreference(`challenge-preference-${index}`, "sample"));
  }
  const report = buildChallengePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
