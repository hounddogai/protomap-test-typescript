import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledRetentionWindowEngine } from "./scheduled-retention-window-engine.js";
import { newScheduledRetentionWindow } from "./scheduled-retention-window.js";

test("ScheduledRetentionWindowEngine keeps results within bounds", () => {
  const engine = defaultScheduledRetentionWindowEngine(flags.newRegistry());
  const item = newScheduledRetentionWindow("code-26", "name-733");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
