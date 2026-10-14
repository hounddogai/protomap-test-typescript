import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedModelSnapshotEngine } from "./capped-model-snapshot-engine.js";
import { newCappedModelSnapshot } from "./capped-model-snapshot.js";

test("CappedModelSnapshotEngine keeps results within bounds", () => {
  const engine = defaultCappedModelSnapshotEngine(flags.newRegistry());
  const item = newCappedModelSnapshot("code-228", "name-75");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
