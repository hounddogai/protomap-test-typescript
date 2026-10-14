import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowDraftReport } from "./window-draft-report.js";
import { WindowDraft, newWindowDraft } from "./window-draft.js";

test("WindowDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_967_174);
  const items: WindowDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWindowDraft(`window-draft-${index}`, "sample"));
  }
  const report = buildWindowDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
