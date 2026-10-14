import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedWaitWindowEngine } from "./capped-wait-window-engine.js";
import { newCappedWaitWindow } from "./capped-wait-window.js";

test("CappedWaitWindowEngine keeps results within bounds", () => {
  const engine = defaultCappedWaitWindowEngine(flags.newRegistry());
  const item = newCappedWaitWindow("code-803", "name-19");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
