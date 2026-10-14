import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitWindowEngine } from "./wait-window-engine.js";
import { newWaitWindow } from "./wait-window.js";

test("WaitWindowEngine keeps results within bounds", () => {
  const engine = defaultWaitWindowEngine(flags.newRegistry());
  const item = newWaitWindow("code-73", "label-147");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
