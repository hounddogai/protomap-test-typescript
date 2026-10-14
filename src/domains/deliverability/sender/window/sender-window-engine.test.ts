import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderWindowEngine } from "./sender-window-engine.js";
import { newSenderWindow } from "./sender-window.js";

test("SenderWindowEngine keeps results within bounds", () => {
  const engine = defaultSenderWindowEngine(flags.newRegistry());
  const item = newSenderWindow("code-690", "title-785");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
