import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingWaitWindowEngine } from "./rolling-wait-window-engine.js";
import { newRollingWaitWindow } from "./rolling-wait-window.js";

test("RollingWaitWindowEngine keeps results within bounds", () => {
  const engine = defaultRollingWaitWindowEngine(flags.newRegistry());
  const item = newRollingWaitWindow("code-942", "label-765");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
