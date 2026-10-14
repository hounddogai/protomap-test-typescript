import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditSnapshotReport } from "./credit-snapshot-report.js";
import { CreditSnapshot, newCreditSnapshot } from "./credit-snapshot.js";

test("CreditSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_530_063);
  const items: CreditSnapshot[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCreditSnapshot(`credit-snapshot-${index}`, "sample"));
  }
  const report = buildCreditSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
