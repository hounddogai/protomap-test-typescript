import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedCsatEntryEngine } from "./batched-csat-entry-engine.js";
import { newBatchedCsatEntry } from "./batched-csat-entry.js";

test("BatchedCsatEntryEngine keeps results within bounds", () => {
  const engine = defaultBatchedCsatEntryEngine(flags.newRegistry());
  const item = newBatchedCsatEntry("code-134", "title-856");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
