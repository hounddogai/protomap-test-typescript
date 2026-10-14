import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalModelEntryEngine } from "./regional-model-entry-engine.js";
import { newRegionalModelEntry } from "./regional-model-entry.js";

test("RegionalModelEntryEngine keeps results within bounds", () => {
  const engine = defaultRegionalModelEntryEngine(flags.newRegistry());
  const item = newRegionalModelEntry("code-300", "title-62");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
