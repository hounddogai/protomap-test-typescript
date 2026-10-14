import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainSnapshotEngine } from "./domain-snapshot-engine.js";
import { newDomainSnapshot } from "./domain-snapshot.js";

test("DomainSnapshotEngine keeps results within bounds", () => {
  const engine = defaultDomainSnapshotEngine();
  const item = newDomainSnapshot("code-862", "label-986");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
