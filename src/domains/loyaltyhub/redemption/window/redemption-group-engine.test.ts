import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionGroupEngine } from "./redemption-group-engine.js";
import { newRedemptionGroup } from "./redemption-group.js";

test("RedemptionGroupEngine keeps results within bounds", () => {
  const engine = defaultRedemptionGroupEngine(flags.newRegistry());
  const item = newRedemptionGroup("code-67", "name-576");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
