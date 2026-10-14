import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredPostWindowEngine } from "./tiered-post-window-engine.js";
import { newTieredPostWindow } from "./tiered-post-window.js";

test("TieredPostWindowEngine keeps results within bounds", () => {
  const engine = defaultTieredPostWindowEngine(flags.newRegistry());
  const item = newTieredPostWindow("code-992", "name-269");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
