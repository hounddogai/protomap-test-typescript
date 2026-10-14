import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalChallengeMappingReport } from "./regional-challenge-mapping-report.js";
import { RegionalChallengeMapping, newRegionalChallengeMapping } from "./regional-challenge-mapping.js";

test("RegionalChallengeMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_506_034);
  const items: RegionalChallengeMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalChallengeMapping(`regional-challenge-mapping-${index}`, "sample"));
  }
  const report = buildRegionalChallengeMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
