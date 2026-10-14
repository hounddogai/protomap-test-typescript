import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPlacementNoticeEngine } from "./placement-notice-engine.js";
import { newPlacementNotice } from "./placement-notice.js";

test("PlacementNoticeEngine keeps results within bounds", () => {
  const engine = defaultPlacementNoticeEngine();
  const item = newPlacementNotice("code-314", "name-77");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
