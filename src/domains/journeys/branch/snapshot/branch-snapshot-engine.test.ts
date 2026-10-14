import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchSnapshotEngine } from "./branch-snapshot-engine.js";
import { newBranchSnapshot } from "./branch-snapshot.js";

test("BranchSnapshotEngine keeps results within bounds", () => {
  const engine = defaultBranchSnapshotEngine(flags.newRegistry());
  const item = newBranchSnapshot("code-279", "label-367");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
