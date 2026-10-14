import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementWindowEngine } from "./placement-window-engine.js";
import { newPlacementWindow } from "./placement-window.js";

test("PlacementWindowEngine keeps results within bounds", () => {
  const engine = defaultPlacementWindowEngine();
  const item = newPlacementWindow("code-971", "title-973");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
