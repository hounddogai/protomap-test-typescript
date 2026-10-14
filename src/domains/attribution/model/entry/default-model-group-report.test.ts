import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultModelGroupReport } from "./default-model-group-report.js";
import { DefaultModelGroup, newDefaultModelGroup } from "./default-model-group.js";

test("DefaultModelGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_667_856);
  const items: DefaultModelGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultModelGroup(`default-model-group-${index}`, "sample"));
  }
  const report = buildDefaultModelGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
