import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyCreativeGroupEngine } from "./legacy-creative-group-engine.js";
import { newLegacyCreativeGroup } from "./legacy-creative-group.js";

test("LegacyCreativeGroupEngine keeps results within bounds", () => {
  const engine = defaultLegacyCreativeGroupEngine();
  const item = newLegacyCreativeGroup("code-21", "name-555");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
