import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutWindowEngine } from "./opt-out-window-engine.js";
import { newOptOutWindow } from "./opt-out-window.js";

test("OptOutWindowEngine keeps results within bounds", () => {
  const engine = defaultOptOutWindowEngine(flags.newRegistry());
  const item = newOptOutWindow("code-579", "title-650");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
