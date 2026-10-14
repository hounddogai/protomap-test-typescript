import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedDomainEntryReport } from "./capped-domain-entry-report.js";
import { CappedDomainEntry, newCappedDomainEntry } from "./capped-domain-entry.js";

test("CappedDomainEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_915_115);
  const items: CappedDomainEntry[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCappedDomainEntry(`capped-domain-entry-${index}`, "sample"));
  }
  const report = buildCappedDomainEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
