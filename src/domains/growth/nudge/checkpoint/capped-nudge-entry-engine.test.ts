import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedNudgeEntryEngine } from "./capped-nudge-entry-engine.js";
import { newCappedNudgeEntry } from "./capped-nudge-entry.js";

test("CappedNudgeEntryEngine keeps results within bounds", () => {
  const engine = defaultCappedNudgeEntryEngine();
  const item = newCappedNudgeEntry("code-413", "label-281");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
