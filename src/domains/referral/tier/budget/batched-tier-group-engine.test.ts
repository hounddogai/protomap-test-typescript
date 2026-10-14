import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedTierGroupEngine } from "./batched-tier-group-engine.js";
import { newBatchedTierGroup } from "./batched-tier-group.js";

test("BatchedTierGroupEngine keeps results within bounds", () => {
  const engine = defaultBatchedTierGroupEngine(flags.newRegistry());
  const item = newBatchedTierGroup("code-560", "title-679");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
