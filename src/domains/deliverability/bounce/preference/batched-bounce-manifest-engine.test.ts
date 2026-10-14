import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedBounceManifestEngine } from "./batched-bounce-manifest-engine.js";
import { newBatchedBounceManifest } from "./batched-bounce-manifest.js";

test("BatchedBounceManifestEngine keeps results within bounds", () => {
  const engine = defaultBatchedBounceManifestEngine(flags.newRegistry());
  const item = newBatchedBounceManifest("code-586", "name-244");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
