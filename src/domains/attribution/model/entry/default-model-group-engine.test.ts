import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultModelGroupEngine } from "./default-model-group-engine.js";
import { newDefaultModelGroup } from "./default-model-group.js";

test("DefaultModelGroupEngine keeps results within bounds", () => {
  const engine = defaultDefaultModelGroupEngine();
  const item = newDefaultModelGroup("code-966", "title-93");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
