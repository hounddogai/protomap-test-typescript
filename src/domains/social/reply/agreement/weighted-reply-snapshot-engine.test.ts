import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedReplySnapshotEngine } from "./weighted-reply-snapshot-engine.js";
import { newWeightedReplySnapshot } from "./weighted-reply-snapshot.js";

test("WeightedReplySnapshotEngine keeps results within bounds", () => {
  const engine = defaultWeightedReplySnapshotEngine(flags.newRegistry());
  const item = newWeightedReplySnapshot("code-781", "name-646");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
