import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalTierMappingEngine } from "./seasonal-tier-mapping-engine.js";
import { newSeasonalTierMapping } from "./seasonal-tier-mapping.js";

test("SeasonalTierMappingEngine keeps results within bounds", () => {
  const engine = defaultSeasonalTierMappingEngine(flags.newRegistry());
  const item = newSeasonalTierMapping("code-640", "title-357");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
