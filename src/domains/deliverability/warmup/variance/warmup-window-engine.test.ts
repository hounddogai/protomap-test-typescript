import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupWindowEngine } from "./warmup-window-engine.js";
import { newWarmupWindow } from "./warmup-window.js";

test("WarmupWindowEngine keeps results within bounds", () => {
  const engine = defaultWarmupWindowEngine(flags.newRegistry());
  const item = newWarmupWindow("code-310", "name-987");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
