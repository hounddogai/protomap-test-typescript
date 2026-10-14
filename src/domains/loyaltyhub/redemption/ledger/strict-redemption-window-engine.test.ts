import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictRedemptionWindowEngine } from "./strict-redemption-window-engine.js";
import { newStrictRedemptionWindow } from "./strict-redemption-window.js";

test("StrictRedemptionWindowEngine keeps results within bounds", () => {
  const engine = defaultStrictRedemptionWindowEngine(flags.newRegistry());
  const item = newStrictRedemptionWindow("code-991", "title-931");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
