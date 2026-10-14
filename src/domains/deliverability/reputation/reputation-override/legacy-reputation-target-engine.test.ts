import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyReputationTargetEngine } from "./legacy-reputation-target-engine.js";
import { newLegacyReputationTarget } from "./legacy-reputation-target.js";

test("LegacyReputationTargetEngine keeps results within bounds", () => {
  const engine = defaultLegacyReputationTargetEngine();
  const item = newLegacyReputationTarget("code-211", "title-117");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
