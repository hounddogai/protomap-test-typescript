import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackCreativeWindowEngine } from "./fallback-creative-window-engine.js";
import { newFallbackCreativeWindow } from "./fallback-creative-window.js";

test("FallbackCreativeWindowEngine keeps results within bounds", () => {
  const engine = defaultFallbackCreativeWindowEngine(flags.newRegistry());
  const item = newFallbackCreativeWindow("code-561", "label-880");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
