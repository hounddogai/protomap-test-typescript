import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchTemplateEngine } from "./branch-template-engine.js";
import { newBranchTemplate } from "./branch-template.js";

test("BranchTemplateEngine keeps results within bounds", () => {
  const engine = defaultBranchTemplateEngine();
  const item = newBranchTemplate("code-752", "name-188");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
