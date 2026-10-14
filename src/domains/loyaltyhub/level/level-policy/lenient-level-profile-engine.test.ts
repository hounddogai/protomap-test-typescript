import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientLevelProfileEngine } from "./lenient-level-profile-engine.js";
import { newLenientLevelProfile } from "./lenient-level-profile.js";

test("LenientLevelProfileEngine keeps results within bounds", () => {
  const engine = defaultLenientLevelProfileEngine();
  const item = newLenientLevelProfile("code-846", "name-875");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
