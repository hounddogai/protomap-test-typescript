import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelWindowEngine } from "./funnel-window-engine.js";
import { newFunnelWindow } from "./funnel-window.js";

test("FunnelWindowEngine keeps results within bounds", () => {
  const engine = defaultFunnelWindowEngine(flags.newRegistry());
  const item = newFunnelWindow("code-147", "name-997");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
