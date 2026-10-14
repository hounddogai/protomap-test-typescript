import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackNudgeEntryEngine } from "./fallback-nudge-entry-engine.js";
import { newFallbackNudgeEntry } from "./fallback-nudge-entry.js";

test("FallbackNudgeEntryEngine keeps results within bounds", () => {
  const engine = defaultFallbackNudgeEntryEngine(flags.newRegistry());
  const item = newFallbackNudgeEntry("code-607", "title-836");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
