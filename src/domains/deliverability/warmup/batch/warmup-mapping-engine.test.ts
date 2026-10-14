import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupMappingEngine } from "./warmup-mapping-engine.js";
import { newWarmupMapping } from "./warmup-mapping.js";

test("WarmupMappingEngine keeps results within bounds", () => {
  const engine = defaultWarmupMappingEngine(flags.newRegistry());
  const item = newWarmupMapping("code-107", "label-796");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
