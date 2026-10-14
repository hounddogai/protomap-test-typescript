import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionWindowReport } from "./subscription-window-report.js";
import { SubscriptionWindow, newSubscriptionWindow } from "./subscription-window.js";

test("SubscriptionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_584_072);
  const items: SubscriptionWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSubscriptionWindow(`subscription-window-${index}`, "sample"));
  }
  const report = buildSubscriptionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
