import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainDraftReport } from "./domain-draft-report.js";
import { DomainDraft, newDomainDraft } from "./domain-draft.js";

test("DomainDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_239_037);
  const items: DomainDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDomainDraft(`domain-draft-${index}`, "sample"));
  }
  const report = buildDomainDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
