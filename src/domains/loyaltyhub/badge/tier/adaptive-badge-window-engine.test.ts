import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBadgeWindowEngine } from "./adaptive-badge-window-engine.js";
import { newAdaptiveBadgeWindow } from "./adaptive-badge-window.js";

test("AdaptiveBadgeWindowEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBadgeWindowEngine(flags.newRegistry());
  const item = newAdaptiveBadgeWindow("code-932", "label-822");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
