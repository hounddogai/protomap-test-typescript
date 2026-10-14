import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofSnapshotEngine } from "./proof-snapshot-engine.js";
import { newProofSnapshot } from "./proof-snapshot.js";

test("ProofSnapshotEngine keeps results within bounds", () => {
  const engine = defaultProofSnapshotEngine(flags.newRegistry());
  const item = newProofSnapshot("code-380", "title-643");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
