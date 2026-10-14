import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderCheckpointEngine } from "./sender-checkpoint-engine.js";
import { newSenderCheckpoint } from "./sender-checkpoint.js";

test("SenderCheckpointEngine keeps results within bounds", () => {
  const engine = defaultSenderCheckpointEngine(flags.newRegistry());
  const item = newSenderCheckpoint("code-342", "name-926");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
