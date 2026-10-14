import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimarySenderCheckpointEngine } from "./primary-sender-checkpoint-engine.js";
import { newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("PrimarySenderCheckpointEngine keeps results within bounds", () => {
  const engine = defaultPrimarySenderCheckpointEngine(flags.newRegistry());
  const item = newPrimarySenderCheckpoint("code-662", "name-365");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
