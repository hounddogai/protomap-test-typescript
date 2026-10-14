import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredOptOutWindowEngine } from "./tiered-opt-out-window-engine.js";
import { newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("TieredOptOutWindowEngine keeps results within bounds", () => {
  const engine = defaultTieredOptOutWindowEngine();
  const item = newTieredOptOutWindow("code-903", "name-748");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
