import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitEntryEngine } from "./wait-entry-engine.js";
import { newWaitEntry } from "./wait-entry.js";

test("WaitEntryEngine keeps results within bounds", () => {
  const engine = defaultWaitEntryEngine(flags.newRegistry());
  const item = newWaitEntry("code-273", "title-889");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
