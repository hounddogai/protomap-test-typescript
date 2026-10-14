import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckSnapshotEngine } from "./fraud-check-snapshot-engine.js";
import { newFraudCheckSnapshot } from "./fraud-check-snapshot.js";

test("FraudCheckSnapshotEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckSnapshotEngine(flags.newRegistry());
  const item = newFraudCheckSnapshot("code-74", "name-112");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
