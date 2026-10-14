import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryActivationSnapshotEngine } from "./primary-activation-snapshot-engine.js";
import { newPrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

test("PrimaryActivationSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPrimaryActivationSnapshotEngine(flags.newRegistry());
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
