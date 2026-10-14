import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeGroupReport } from "./creative-group-report.js";
import { CreativeGroup, newCreativeGroup } from "./creative-group.js";

test("CreativeGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_774_419);
  const items: CreativeGroup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeGroup(`creative-group-${index}`, "sample"));
  }
  const report = buildCreativeGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
