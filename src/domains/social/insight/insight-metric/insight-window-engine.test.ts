import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightWindowEngine } from "./insight-window-engine.js";
import { newInsightWindow } from "./insight-window.js";

test("InsightWindowEngine keeps results within bounds", () => {
  const engine = defaultInsightWindowEngine();
  const item = newInsightWindow("code-763", "title-118");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
