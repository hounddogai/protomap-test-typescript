import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryDeflectionBaselineReport } from "./primary-deflection-baseline-report.js";
import { PrimaryDeflectionBaseline, newPrimaryDeflectionBaseline } from "./primary-deflection-baseline.js";

test("PrimaryDeflectionBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_441_801);
  const items: PrimaryDeflectionBaseline[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryDeflectionBaseline(`primary-deflection-baseline-${index}`, "sample"));
  }
  const report = buildPrimaryDeflectionBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
