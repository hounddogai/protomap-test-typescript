import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionWindowEngine } from "./retention-window-engine.js";
import { newRetentionWindow } from "./retention-window.js";

test("RetentionWindowEngine keeps results within bounds", () => {
  const engine = defaultRetentionWindowEngine(flags.newRegistry());
  const item = newRetentionWindow("code-495", "label-666");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
