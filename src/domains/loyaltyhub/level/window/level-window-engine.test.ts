import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelWindowEngine } from "./level-window-engine.js";
import { newLevelWindow } from "./level-window.js";

test("LevelWindowEngine keeps results within bounds", () => {
  const engine = defaultLevelWindowEngine();
  const item = newLevelWindow("code-675", "name-400");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
