import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBadgeCheckpointEngine } from "./badge-checkpoint-engine.js";
import { newBadgeCheckpoint } from "./badge-checkpoint.js";

test("BadgeCheckpointEngine keeps results within bounds", () => {
  const engine = defaultBadgeCheckpointEngine(flags.newRegistry());
  const item = newBadgeCheckpoint("code-568", "name-39");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
