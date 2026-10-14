import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionWindowEngine } from "./redemption-window-engine.js";
import { newRedemptionWindow } from "./redemption-window.js";

test("RedemptionWindowEngine keeps results within bounds", () => {
  const engine = defaultRedemptionWindowEngine();
  const item = newRedemptionWindow("code-828", "title-281");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
