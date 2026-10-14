import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryPostSnapshotEngine } from "./primary-post-snapshot-engine.js";
import { newPrimaryPostSnapshot } from "./primary-post-snapshot.js";

test("PrimaryPostSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPostSnapshotEngine(flags.newRegistry());
  const item = newPrimaryPostSnapshot("code-540", "label-507");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
