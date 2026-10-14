import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelSnapshotEngine } from "./model-snapshot-engine.js";
import { newModelSnapshot } from "./model-snapshot.js";

test("ModelSnapshotEngine keeps results within bounds", () => {
  const engine = defaultModelSnapshotEngine(flags.newRegistry());
  const item = newModelSnapshot("code-628", "label-60");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
