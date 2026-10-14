import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBidRuleWindowEngine } from "./strict-bid-rule-window-engine.js";
import { newStrictBidRuleWindow } from "./strict-bid-rule-window.js";

test("StrictBidRuleWindowEngine keeps results within bounds", () => {
  const engine = defaultStrictBidRuleWindowEngine(flags.newRegistry());
  const item = newStrictBidRuleWindow("code-945", "title-323");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
