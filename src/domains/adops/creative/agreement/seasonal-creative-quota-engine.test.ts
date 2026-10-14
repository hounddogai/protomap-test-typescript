import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalCreativeQuotaEngine } from "./seasonal-creative-quota-engine.js";
import { newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("SeasonalCreativeQuotaEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCreativeQuotaEngine();
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
