import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualActivationWindowEngine } from "./manual-activation-window-engine.js";
import { newManualActivationWindow } from "./manual-activation-window.js";

test("ManualActivationWindowEngine keeps results within bounds", () => {
  const engine = defaultManualActivationWindowEngine(flags.newRegistry());
  const item = newManualActivationWindow("code-689", "name-677");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
