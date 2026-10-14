import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchGroupEngine } from "./branch-group-engine.js";
import { newBranchGroup } from "./branch-group.js";

test("BranchGroupEngine keeps results within bounds", () => {
  const engine = defaultBranchGroupEngine();
  const item = newBranchGroup("code-988", "title-339");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
