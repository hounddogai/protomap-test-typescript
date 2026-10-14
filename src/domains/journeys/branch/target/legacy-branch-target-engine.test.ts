import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyBranchTargetEngine } from "./legacy-branch-target-engine.js";
import { newLegacyBranchTarget } from "./legacy-branch-target.js";

test("LegacyBranchTargetEngine keeps results within bounds", () => {
  const engine = defaultLegacyBranchTargetEngine();
  const item = newLegacyBranchTarget("code-669", "title-277");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
