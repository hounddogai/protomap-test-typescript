import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedModelGroupEngine } from "./capped-model-group-engine.js";
import { newCappedModelGroup } from "./capped-model-group.js";

test("CappedModelGroupEngine keeps results within bounds", () => {
  const engine = defaultCappedModelGroupEngine();
  const item = newCappedModelGroup("code-185", "label-323");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
