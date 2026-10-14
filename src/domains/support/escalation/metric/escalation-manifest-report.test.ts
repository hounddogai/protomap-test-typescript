import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEscalationManifestReport } from "./escalation-manifest-report.js";
import { EscalationManifest, newEscalationManifest } from "./escalation-manifest.js";

test("EscalationManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_262_834);
  const items: EscalationManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newEscalationManifest(`escalation-manifest-${index}`, "sample"));
  }
  const report = buildEscalationManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
