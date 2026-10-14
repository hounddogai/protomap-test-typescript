import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWarmupGroupEngine } from "./warmup-group-engine.js";
import { newWarmupGroup } from "./warmup-group.js";

test("WarmupGroupEngine keeps results within bounds", () => {
  const engine = defaultWarmupGroupEngine();
  const item = newWarmupGroup("code-664", "title-707");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
