import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredQueueGroupEngine } from "./tiered-queue-group-engine.js";
import { newTieredQueueGroup } from "./tiered-queue-group.js";

test("TieredQueueGroupEngine keeps results within bounds", () => {
  const engine = defaultTieredQueueGroupEngine(flags.newRegistry());
  const item = newTieredQueueGroup("code-695", "label-39");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
