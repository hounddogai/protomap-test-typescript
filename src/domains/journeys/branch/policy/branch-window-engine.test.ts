import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchWindowEngine } from "./branch-window-engine.js";
import { newBranchWindow } from "./branch-window.js";

test("BranchWindowEngine keeps results within bounds", () => {
  const engine = defaultBranchWindowEngine();
  const item = newBranchWindow("code-702", "name-640");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
