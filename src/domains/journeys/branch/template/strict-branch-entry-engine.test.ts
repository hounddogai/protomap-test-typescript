import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBranchEntryEngine } from "./strict-branch-entry-engine.js";
import { newStrictBranchEntry } from "./strict-branch-entry.js";

test("StrictBranchEntryEngine keeps results within bounds", () => {
  const engine = defaultStrictBranchEntryEngine(flags.newRegistry());
  const item = newStrictBranchEntry("code-65", "label-149");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
