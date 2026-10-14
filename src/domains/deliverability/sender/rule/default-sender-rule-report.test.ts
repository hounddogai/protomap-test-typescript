import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultSenderRuleReport } from "./default-sender-rule-report.js";
import { DefaultSenderRule, newDefaultSenderRule } from "./default-sender-rule.js";

test("DefaultSenderRuleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_515_914);
  const items: DefaultSenderRule[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultSenderRule(`default-sender-rule-${index}`, "sample"));
  }
  const report = buildDefaultSenderRuleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
