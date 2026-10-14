import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredActivationWindowEngine } from "./tiered-activation-window-engine.js";
import { newTieredActivationWindow } from "./tiered-activation-window.js";

test("TieredActivationWindowEngine keeps results within bounds", () => {
  const engine = defaultTieredActivationWindowEngine(flags.newRegistry());
  const item = newTieredActivationWindow("code-362", "title-155");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
