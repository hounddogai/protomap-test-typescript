import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientDeflectionSnapshotEngine } from "./lenient-deflection-snapshot-engine.js";
import { newLenientDeflectionSnapshot } from "./lenient-deflection-snapshot.js";

test("LenientDeflectionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultLenientDeflectionSnapshotEngine();
  const item = newLenientDeflectionSnapshot("code-344", "label-600");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
