import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationDigestReport } from "./escalation-digest-report.js";
import { EscalationDigest, newEscalationDigest } from "./escalation-digest.js";

test("EscalationDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_823_768);
  const items: EscalationDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newEscalationDigest(`escalation-digest-${index}`, "sample"));
  }
  const report = buildEscalationDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
