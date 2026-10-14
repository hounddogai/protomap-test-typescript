import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalManifestReport } from "./approval-manifest-report.js";
import { ApprovalManifest, newApprovalManifest } from "./approval-manifest.js";

test("ApprovalManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_988_140);
  const items: ApprovalManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newApprovalManifest(`approval-manifest-${index}`, "sample"));
  }
  const report = buildApprovalManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
