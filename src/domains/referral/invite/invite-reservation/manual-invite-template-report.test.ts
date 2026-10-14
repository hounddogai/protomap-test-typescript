import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualInviteTemplateReport } from "./manual-invite-template-report.js";
import { ManualInviteTemplate, newManualInviteTemplate } from "./manual-invite-template.js";

test("ManualInviteTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_589_064);
  const items: ManualInviteTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualInviteTemplate(`manual-invite-template-${index}`, "sample"));
  }
  const report = buildManualInviteTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
