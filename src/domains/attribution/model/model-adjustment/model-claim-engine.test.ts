import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelClaimEngine } from "./model-claim-engine.js";
import { newModelClaim } from "./model-claim.js";

test("ModelClaimEngine keeps results within bounds", () => {
  const engine = defaultModelClaimEngine();
  const item = newModelClaim("code-947", "name-105");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
