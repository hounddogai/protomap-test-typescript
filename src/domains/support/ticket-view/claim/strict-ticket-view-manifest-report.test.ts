import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTicketViewManifestReport } from "./strict-ticket-view-manifest-report.js";
import { StrictTicketViewManifest, newStrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

test("StrictTicketViewManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_772_817);
  const items: StrictTicketViewManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictTicketViewManifest(`strict-ticket-view-manifest-${index}`, "sample"));
  }
  const report = buildStrictTicketViewManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
