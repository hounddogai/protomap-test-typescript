import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultActivationTemplateReport } from "./default-activation-template-report.js";
import { DefaultActivationTemplate, newDefaultActivationTemplate } from "./default-activation-template.js";

test("DefaultActivationTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_546_000);
  const items: DefaultActivationTemplate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultActivationTemplate(`default-activation-template-${index}`, "sample"));
  }
  const report = buildDefaultActivationTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
