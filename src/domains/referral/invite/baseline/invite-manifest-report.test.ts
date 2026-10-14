import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteManifestReport } from "./invite-manifest-report.js";
import { InviteManifest, newInviteManifest } from "./invite-manifest.js";

test("InviteManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_088_516);
  const items: InviteManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInviteManifest(`invite-manifest-${index}`, "sample"));
  }
  const report = buildInviteManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
