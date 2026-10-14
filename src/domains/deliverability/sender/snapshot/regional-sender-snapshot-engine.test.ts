import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalSenderSnapshotEngine } from "./regional-sender-snapshot-engine.js";
import { newRegionalSenderSnapshot } from "./regional-sender-snapshot.js";

test("RegionalSenderSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRegionalSenderSnapshotEngine();
  const item = newRegionalSenderSnapshot("code-101", "label-943");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
