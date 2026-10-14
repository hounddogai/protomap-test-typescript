import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderSnapshotEngine } from "./sender-snapshot-engine.js";
import { newSenderSnapshot } from "./sender-snapshot.js";

test("SenderSnapshotEngine keeps results within bounds", () => {
  const engine = defaultSenderSnapshotEngine();
  const item = newSenderSnapshot("code-72", "label-991");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
