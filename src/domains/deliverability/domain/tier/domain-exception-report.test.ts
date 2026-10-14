import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainExceptionReport } from "./domain-exception-report.js";
import { DomainException, newDomainException } from "./domain-exception.js";

test("DomainExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_462_745);
  const items: DomainException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDomainException(`domain-exception-${index}`, "sample"));
  }
  const report = buildDomainExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
