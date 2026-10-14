import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalDoubleOptInEntryEngine } from "./regional-double-opt-in-entry-engine.js";
import { newRegionalDoubleOptInEntry } from "./regional-double-opt-in-entry.js";

test("RegionalDoubleOptInEntryEngine keeps results within bounds", () => {
  const engine = defaultRegionalDoubleOptInEntryEngine(flags.newRegistry());
  const item = newRegionalDoubleOptInEntry("code-260", "label-736");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
