import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionWindowEngine } from "./subscription-window-engine.js";
import { newSubscriptionWindow } from "./subscription-window.js";

test("SubscriptionWindowEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionWindowEngine(flags.newRegistry());
  const item = newSubscriptionWindow("code-227", "label-927");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
