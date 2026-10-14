import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalWaitGroupEngine } from "./regional-wait-group-engine.js";
import { newRegionalWaitGroup } from "./regional-wait-group.js";

test("RegionalWaitGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalWaitGroupEngine(flags.newRegistry());
  const item = newRegionalWaitGroup("code-619", "name-714");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
