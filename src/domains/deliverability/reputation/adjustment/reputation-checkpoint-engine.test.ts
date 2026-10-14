import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationCheckpointEngine } from "./reputation-checkpoint-engine.js";
import { newReputationCheckpoint } from "./reputation-checkpoint.js";

test("ReputationCheckpointEngine keeps results within bounds", () => {
  const engine = defaultReputationCheckpointEngine(flags.newRegistry());
  const item = newReputationCheckpoint("code-64", "title-267");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
