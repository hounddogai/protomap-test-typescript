import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackSenderEntryEngine } from "./fallback-sender-entry-engine.js";
import { newFallbackSenderEntry } from "./fallback-sender-entry.js";

test("FallbackSenderEntryEngine keeps results within bounds", () => {
  const engine = defaultFallbackSenderEntryEngine();
  const item = newFallbackSenderEntry("code-659", "label-315");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
