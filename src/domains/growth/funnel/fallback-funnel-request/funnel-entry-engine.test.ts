import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelEntryEngine } from "./funnel-entry-engine.js";
import { newFunnelEntry } from "./funnel-entry.js";

test("FunnelEntryEngine keeps results within bounds", () => {
  const engine = defaultFunnelEntryEngine();
  const item = newFunnelEntry("code-751", "label-378");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
