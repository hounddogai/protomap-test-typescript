import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedRedemptionWindowEngine } from "./capped-redemption-window-engine.js";
import { newCappedRedemptionWindow } from "./capped-redemption-window.js";

test("CappedRedemptionWindowEngine keeps results within bounds", () => {
  const engine = defaultCappedRedemptionWindowEngine(flags.newRegistry());
  const item = newCappedRedemptionWindow("code-577", "name-20");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
