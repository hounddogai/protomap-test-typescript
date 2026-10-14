import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionProfileEngine } from "./deflection-profile-engine.js";
import { newDeflectionProfile } from "./deflection-profile.js";

test("DeflectionProfileEngine keeps results within bounds", () => {
  const engine = defaultDeflectionProfileEngine();
  const item = newDeflectionProfile("code-926", "name-52");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
