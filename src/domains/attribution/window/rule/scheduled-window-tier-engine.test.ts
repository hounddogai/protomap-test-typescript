import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledWindowTierEngine } from "./scheduled-window-tier-engine.js";
import { newScheduledWindowTier } from "./scheduled-window-tier.js";

test("ScheduledWindowTierEngine keeps results within bounds", () => {
  const engine = defaultScheduledWindowTierEngine(flags.newRegistry());
  const item = newScheduledWindowTier("code-686", "title-85");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
