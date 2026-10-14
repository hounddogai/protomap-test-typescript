import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceWindowEngine } from "./bounce-window-engine.js";
import { newBounceWindow } from "./bounce-window.js";

test("BounceWindowEngine keeps results within bounds", () => {
  const engine = defaultBounceWindowEngine(flags.newRegistry());
  const item = newBounceWindow("code-57", "title-708");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
