import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryTouchpointWindowEngine } from "./primary-touchpoint-window-engine.js";
import { newPrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

test("PrimaryTouchpointWindowEngine keeps results within bounds", () => {
  const engine = defaultPrimaryTouchpointWindowEngine(flags.newRegistry());
  const item = newPrimaryTouchpointWindow("code-753", "label-671");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
