import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPostProfileEngine } from "./batched-post-profile-engine.js";
import { newBatchedPostProfile } from "./batched-post-profile.js";

test("BatchedPostProfileEngine keeps results within bounds", () => {
  const engine = defaultBatchedPostProfileEngine(flags.newRegistry());
  const item = newBatchedPostProfile("code-439", "title-584");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
