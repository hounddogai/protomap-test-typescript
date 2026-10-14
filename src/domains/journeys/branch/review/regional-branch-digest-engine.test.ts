import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalBranchDigestEngine } from "./regional-branch-digest-engine.js";
import { newRegionalBranchDigest } from "./regional-branch-digest.js";

test("RegionalBranchDigestEngine keeps results within bounds", () => {
  const engine = defaultRegionalBranchDigestEngine();
  const item = newRegionalBranchDigest("code-61", "title-429");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
