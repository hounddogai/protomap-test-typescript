import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingTouchpointWindowEngine } from "./pending-touchpoint-window-engine.js";
import { newPendingTouchpointWindow } from "./pending-touchpoint-window.js";

test("PendingTouchpointWindowEngine keeps results within bounds", () => {
  const engine = defaultPendingTouchpointWindowEngine(flags.newRegistry());
  const item = newPendingTouchpointWindow("code-594", "title-384");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
