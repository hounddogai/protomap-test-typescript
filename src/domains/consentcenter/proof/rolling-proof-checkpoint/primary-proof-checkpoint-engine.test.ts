import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryProofCheckpointEngine } from "./primary-proof-checkpoint-engine.js";
import { newPrimaryProofCheckpoint } from "./primary-proof-checkpoint.js";

test("PrimaryProofCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimaryProofCheckpointEngine(flags.newRegistry());
  const item = newPrimaryProofCheckpoint("code-958", "label-26");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
