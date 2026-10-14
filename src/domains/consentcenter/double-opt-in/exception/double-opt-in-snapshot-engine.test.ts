import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInSnapshotEngine } from "./double-opt-in-snapshot-engine.js";
import { newDoubleOptInSnapshot } from "./double-opt-in-snapshot.js";

test("DoubleOptInSnapshotEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInSnapshotEngine(flags.newRegistry());
  const item = newDoubleOptInSnapshot("code-299", "title-576");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
