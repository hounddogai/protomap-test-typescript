import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyWindowEngine } from "./frequency-window-engine.js";
import { newFrequencyWindow } from "./frequency-window.js";

test("FrequencyWindowEngine keeps results within bounds", () => {
  const engine = defaultFrequencyWindowEngine();
  const item = newFrequencyWindow("code-413", "title-309");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
