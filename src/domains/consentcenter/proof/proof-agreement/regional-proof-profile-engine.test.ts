import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalProofProfileEngine } from "./regional-proof-profile-engine.js";
import { newRegionalProofProfile } from "./regional-proof-profile.js";

test("RegionalProofProfileEngine keeps results within bounds", () => {
  const engine = defaultRegionalProofProfileEngine();
  const item = newRegionalProofProfile("code-770", "name-570");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
