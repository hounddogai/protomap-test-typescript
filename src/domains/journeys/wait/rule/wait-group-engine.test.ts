import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitGroupEngine } from "./wait-group-engine.js";
import { newWaitGroup } from "./wait-group.js";

test("WaitGroupEngine keeps results within bounds", () => {
  const engine = defaultWaitGroupEngine(flags.newRegistry());
  const item = newWaitGroup("code-626", "title-128");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
