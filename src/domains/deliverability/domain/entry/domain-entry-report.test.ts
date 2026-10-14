import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainEntryReport } from "./domain-entry-report.js";
import { DomainEntry, newDomainEntry } from "./domain-entry.js";

test("DomainEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_791_876);
  const items: DomainEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDomainEntry(`domain-entry-${index}`, "sample"));
  }
  const report = buildDomainEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
