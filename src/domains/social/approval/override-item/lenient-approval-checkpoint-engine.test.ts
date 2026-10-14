import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientApprovalCheckpointEngine } from "./lenient-approval-checkpoint-engine.js";
import { newLenientApprovalCheckpoint } from "./lenient-approval-checkpoint.js";

test("LenientApprovalCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLenientApprovalCheckpointEngine(flags.newRegistry());
  const item = newLenientApprovalCheckpoint("code-763", "name-49");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
