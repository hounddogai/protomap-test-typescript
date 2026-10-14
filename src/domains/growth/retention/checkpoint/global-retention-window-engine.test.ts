import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRetentionWindowEngine } from "./global-retention-window-engine.js";
import { newGlobalRetentionWindow } from "./global-retention-window.js";

test("GlobalRetentionWindowEngine keeps results within bounds", () => {
  const engine = defaultGlobalRetentionWindowEngine(flags.newRegistry());
  const item = newGlobalRetentionWindow("code-673", "label-129");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
