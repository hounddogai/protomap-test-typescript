import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSlaCheckpointEngine } from "./capped-sla-checkpoint-engine.js";
import { newCappedSlaCheckpoint } from "./capped-sla-checkpoint.js";

test("CappedSlaCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCappedSlaCheckpointEngine(flags.newRegistry());
  const item = newCappedSlaCheckpoint("code-653", "title-176");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
