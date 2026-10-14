import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEscalationCheckpointEngine } from "./escalation-checkpoint-engine.js";
import { newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("EscalationCheckpointEngine keeps results within bounds", () => {
  const engine = defaultEscalationCheckpointEngine(flags.newRegistry());
  const item = newEscalationCheckpoint("code-595", "label-679");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
