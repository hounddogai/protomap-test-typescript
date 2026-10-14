import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultEscalationManifestReport } from "./default-escalation-manifest-report.js";
import { DefaultEscalationManifest, newDefaultEscalationManifest } from "./default-escalation-manifest.js";

test("DefaultEscalationManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_144_812);
  const items: DefaultEscalationManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultEscalationManifest(`default-escalation-manifest-${index}`, "sample"));
  }
  const report = buildDefaultEscalationManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
