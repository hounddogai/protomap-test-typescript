import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelEntryEngine } from "./model-entry-engine.js";
import { newModelEntry } from "./model-entry.js";

test("ModelEntryEngine keeps results within bounds", () => {
  const engine = defaultModelEntryEngine(flags.newRegistry());
  const item = newModelEntry("code-235", "title-966");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
