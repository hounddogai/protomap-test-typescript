import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatCheckpointEngine } from "./csat-checkpoint-engine.js";
import { newCsatCheckpoint } from "./csat-checkpoint.js";

test("CsatCheckpointEngine keeps results within bounds", () => {
  const engine = defaultCsatCheckpointEngine(flags.newRegistry());
  const item = newCsatCheckpoint("code-722", "name-2");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
