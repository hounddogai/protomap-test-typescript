import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaWindowEngine } from "./sla-window-engine.js";
import { newSlaWindow } from "./sla-window.js";

test("SlaWindowEngine keeps results within bounds", () => {
  const engine = defaultSlaWindowEngine();
  const item = newSlaWindow("code-699", "label-140");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
