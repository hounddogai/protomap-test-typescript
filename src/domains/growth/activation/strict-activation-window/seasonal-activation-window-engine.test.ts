import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalActivationWindowEngine } from "./seasonal-activation-window-engine.js";
import { newSeasonalActivationWindow } from "./seasonal-activation-window.js";

test("SeasonalActivationWindowEngine keeps results within bounds", () => {
  const engine = defaultSeasonalActivationWindowEngine(flags.newRegistry());
  const item = newSeasonalActivationWindow("code-305", "title-529");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
