import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeCycleEngine } from "./creative-cycle-engine.js";
import { newCreativeCycle } from "./creative-cycle.js";

test("CreativeCycleEngine keeps results within bounds", () => {
  const engine = defaultCreativeCycleEngine(flags.newRegistry());
  const item = newCreativeCycle("code-567", "name-906");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
