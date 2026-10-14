import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteMappingReport } from "./invite-mapping-report.js";
import { InviteMapping, newInviteMapping } from "./invite-mapping.js";

test("InviteMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_953_157);
  const items: InviteMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newInviteMapping(`invite-mapping-${index}`, "sample"));
  }
  const report = buildInviteMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
