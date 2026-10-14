import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCreativeEntryEngine } from "./regional-creative-entry-engine.js";
import { newRegionalCreativeEntry } from "./regional-creative-entry.js";

test("RegionalCreativeEntryEngine keeps results within bounds", () => {
  const engine = defaultRegionalCreativeEntryEngine(flags.newRegistry());
  const item = newRegionalCreativeEntry("code-798", "label-446");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
