import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceMappingEngine } from "./bounce-mapping-engine.js";
import { newBounceMapping } from "./bounce-mapping.js";

test("BounceMappingEngine keeps results within bounds", () => {
  const engine = defaultBounceMappingEngine(flags.newRegistry());
  const item = newBounceMapping("code-377", "name-122");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
