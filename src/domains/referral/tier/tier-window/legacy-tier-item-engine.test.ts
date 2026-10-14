import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyTierItemEngine } from "./legacy-tier-item-engine.js";
import { newLegacyTierItem } from "./legacy-tier-item.js";

test("LegacyTierItemEngine keeps results within bounds", () => {
  const engine = defaultLegacyTierItemEngine(flags.newRegistry());
  const item = newLegacyTierItem("code-288", "title-633");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
