import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredPathMappingEngine } from "./tiered-path-mapping-engine.js";
import { newTieredPathMapping } from "./tiered-path-mapping.js";

test("TieredPathMappingEngine keeps results within bounds", () => {
  const engine = defaultTieredPathMappingEngine(flags.newRegistry());
  const item = newTieredPathMapping("code-233", "label-933");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
