import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalWaitEntryEngine } from "./regional-wait-entry-engine.js";
import { newRegionalWaitEntry } from "./regional-wait-entry.js";

test("RegionalWaitEntryEngine keeps results within bounds", () => {
  const engine = defaultRegionalWaitEntryEngine(flags.newRegistry());
  const item = newRegionalWaitEntry("code-220", "label-2");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
