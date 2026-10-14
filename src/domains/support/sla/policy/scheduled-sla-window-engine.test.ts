import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledSlaWindowEngine } from "./scheduled-sla-window-engine.js";
import { newScheduledSlaWindow } from "./scheduled-sla-window.js";

test("ScheduledSlaWindowEngine keeps results within bounds", () => {
  const engine = defaultScheduledSlaWindowEngine();
  const item = newScheduledSlaWindow("code-591", "title-601");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
