import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryFrequencyWindowEngine } from "./primary-frequency-window-engine.js";
import { newPrimaryFrequencyWindow } from "./primary-frequency-window.js";

test("PrimaryFrequencyWindowEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFrequencyWindowEngine();
  const item = newPrimaryFrequencyWindow("code-839", "name-689");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
