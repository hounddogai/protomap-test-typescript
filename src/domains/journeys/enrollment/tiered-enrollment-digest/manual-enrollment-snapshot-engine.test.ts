import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualEnrollmentSnapshotEngine } from "./manual-enrollment-snapshot-engine.js";
import { newManualEnrollmentSnapshot } from "./manual-enrollment-snapshot.js";

test("ManualEnrollmentSnapshotEngine keeps results within bounds", () => {
  const engine = defaultManualEnrollmentSnapshotEngine(flags.newRegistry());
  const item = newManualEnrollmentSnapshot("code-694", "label-284");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
