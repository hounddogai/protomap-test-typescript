import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingRedemptionWindowEngine } from "./rolling-redemption-window-engine.js";
import { newRollingRedemptionWindow } from "./rolling-redemption-window.js";

test("RollingRedemptionWindowEngine keeps results within bounds", () => {
  const engine = defaultRollingRedemptionWindowEngine(flags.newRegistry());
  const item = newRollingRedemptionWindow("code-359", "label-250");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
