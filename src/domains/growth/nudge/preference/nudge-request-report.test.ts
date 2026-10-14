import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeRequestReport } from "./nudge-request-report.js";
import { NudgeRequest, newNudgeRequest } from "./nudge-request.js";

test("NudgeRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_633_519);
  const items: NudgeRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newNudgeRequest(`nudge-request-${index}`, "sample"));
  }
  const report = buildNudgeRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
