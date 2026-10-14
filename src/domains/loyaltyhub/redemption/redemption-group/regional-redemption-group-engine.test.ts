import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalRedemptionGroupEngine } from "./regional-redemption-group-engine.js";
import { newRegionalRedemptionGroup } from "./regional-redemption-group.js";

test("RegionalRedemptionGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalRedemptionGroupEngine();
  const item = newRegionalRedemptionGroup("code-666", "name-245");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
