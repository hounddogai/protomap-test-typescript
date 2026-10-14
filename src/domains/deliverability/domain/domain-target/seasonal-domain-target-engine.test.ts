import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDomainTargetEngine } from "./seasonal-domain-target-engine.js";
import { newSeasonalDomainTarget } from "./seasonal-domain-target.js";

test("SeasonalDomainTargetEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDomainTargetEngine(flags.newRegistry());
  const item = newSeasonalDomainTarget("code-875", "title-565");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
