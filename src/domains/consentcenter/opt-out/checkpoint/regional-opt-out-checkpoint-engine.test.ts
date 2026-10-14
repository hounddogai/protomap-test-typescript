import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalOptOutCheckpointEngine } from "./regional-opt-out-checkpoint-engine.js";
import { newRegionalOptOutCheckpoint } from "./regional-opt-out-checkpoint.js";

test("RegionalOptOutCheckpointEngine keeps results within bounds", () => {
  const engine = defaultRegionalOptOutCheckpointEngine(flags.newRegistry());
  const item = newRegionalOptOutCheckpoint("code-136", "label-421");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
