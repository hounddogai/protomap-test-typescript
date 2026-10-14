import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredPreferenceGroupEngine } from "./tiered-preference-group-engine.js";
import { newTieredPreferenceGroup } from "./tiered-preference-group.js";

test("TieredPreferenceGroupEngine keeps results within bounds", () => {
  const engine = defaultTieredPreferenceGroupEngine();
  const item = newTieredPreferenceGroup("code-876", "label-80");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
