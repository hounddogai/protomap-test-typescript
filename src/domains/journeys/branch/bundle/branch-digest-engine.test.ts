import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchDigestEngine } from "./branch-digest-engine.js";
import { newBranchDigest } from "./branch-digest.js";

test("BranchDigestEngine keeps results within bounds", () => {
  const engine = defaultBranchDigestEngine();
  const item = newBranchDigest("code-924", "label-582");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
