import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedReputationBundleEngine } from "./batched-reputation-bundle-engine.js";
import { newBatchedReputationBundle } from "./batched-reputation-bundle.js";

test("BatchedReputationBundleEngine keeps results within bounds", () => {
  const engine = defaultBatchedReputationBundleEngine(flags.newRegistry());
  const item = newBatchedReputationBundle("code-609", "title-25");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
