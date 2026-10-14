import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchProfileEngine } from "./branch-profile-engine.js";
import { newBranchProfile } from "./branch-profile.js";

test("BranchProfileEngine keeps results within bounds", () => {
  const engine = defaultBranchProfileEngine(flags.newRegistry());
  const item = newBranchProfile("code-85", "title-868");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
