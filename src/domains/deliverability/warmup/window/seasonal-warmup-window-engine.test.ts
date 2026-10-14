import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalWarmupWindowEngine } from "./seasonal-warmup-window-engine.js";
import { newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

test("SeasonalWarmupWindowEngine keeps results within bounds", () => {
  const engine = defaultSeasonalWarmupWindowEngine();
  const item = newSeasonalWarmupWindow("code-591", "title-576");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
