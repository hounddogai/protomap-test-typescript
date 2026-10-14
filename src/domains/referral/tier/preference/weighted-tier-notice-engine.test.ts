import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedTierNoticeEngine } from "./weighted-tier-notice-engine.js";
import { newWeightedTierNotice } from "./weighted-tier-notice.js";

test("WeightedTierNoticeEngine keeps results within bounds", () => {
  const engine = defaultWeightedTierNoticeEngine();
  const item = newWeightedTierNotice("code-732", "name-898");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
