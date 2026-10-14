import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPostQuotaEngine } from "./batched-post-quota-engine.js";
import { newBatchedPostQuota } from "./batched-post-quota.js";

test("BatchedPostQuotaEngine keeps results within bounds", () => {
  const engine = defaultBatchedPostQuotaEngine(flags.newRegistry());
  const item = newBatchedPostQuota("code-13", "name-169");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
