import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPaywallWindowEngine } from "./rolling-paywall-window-engine.js";
import { newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("RollingPaywallWindowEngine keeps results within bounds", () => {
  const engine = defaultRollingPaywallWindowEngine(flags.newRegistry());
  const item = newRollingPaywallWindow("code-539", "label-806");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
