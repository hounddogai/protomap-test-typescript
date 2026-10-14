import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchEntryEngine } from "./branch-entry-engine.js";
import { newBranchEntry } from "./branch-entry.js";

test("BranchEntryEngine keeps results within bounds", () => {
  const engine = defaultBranchEntryEngine(flags.newRegistry());
  const item = newBranchEntry("code-828", "name-888");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
