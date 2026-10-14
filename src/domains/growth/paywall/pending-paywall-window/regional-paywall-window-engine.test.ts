import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPaywallWindowEngine } from "./regional-paywall-window-engine.js";
import { newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("RegionalPaywallWindowEngine keeps results within bounds", () => {
  const engine = defaultRegionalPaywallWindowEngine(flags.newRegistry());
  const item = newRegionalPaywallWindow("code-101", "title-314");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
