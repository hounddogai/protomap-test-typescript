import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientCsatCheckpointEngine } from "./lenient-csat-checkpoint-engine.js";
import { newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("LenientCsatCheckpointEngine keeps results within bounds", () => {
  const engine = defaultLenientCsatCheckpointEngine(flags.newRegistry());
  const item = newLenientCsatCheckpoint("code-411", "label-792");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
