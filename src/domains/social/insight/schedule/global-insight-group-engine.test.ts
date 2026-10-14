import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalInsightGroupEngine } from "./global-insight-group-engine.js";
import { newGlobalInsightGroup } from "./global-insight-group.js";

test("GlobalInsightGroupEngine keeps results within bounds", () => {
  const engine = defaultGlobalInsightGroupEngine();
  const item = newGlobalInsightGroup("code-514", "label-229");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
