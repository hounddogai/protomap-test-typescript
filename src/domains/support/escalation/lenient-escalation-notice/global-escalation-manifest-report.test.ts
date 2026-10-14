import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalEscalationManifestReport } from "./global-escalation-manifest-report.js";
import { GlobalEscalationManifest, newGlobalEscalationManifest } from "./global-escalation-manifest.js";

test("GlobalEscalationManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_717_417);
  const items: GlobalEscalationManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalEscalationManifest(`global-escalation-manifest-${index}`, "sample"));
  }
  const report = buildGlobalEscalationManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
