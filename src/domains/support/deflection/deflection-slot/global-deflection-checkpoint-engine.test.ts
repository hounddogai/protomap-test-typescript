import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalDeflectionCheckpointEngine } from "./global-deflection-checkpoint-engine.js";
import { newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("GlobalDeflectionCheckpointEngine keeps results within bounds", () => {
  const engine = defaultGlobalDeflectionCheckpointEngine(flags.newRegistry());
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
