import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDomainVarianceEngine } from "./seasonal-domain-variance-engine.js";
import { newSeasonalDomainVariance } from "./seasonal-domain-variance.js";

test("SeasonalDomainVarianceEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDomainVarianceEngine(flags.newRegistry());
  const item = newSeasonalDomainVariance("code-69", "name-877");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
