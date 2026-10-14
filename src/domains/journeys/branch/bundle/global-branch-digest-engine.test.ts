import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalBranchDigestEngine } from "./global-branch-digest-engine.js";
import { newGlobalBranchDigest } from "./global-branch-digest.js";

test("GlobalBranchDigestEngine keeps results within bounds", () => {
  const engine = defaultGlobalBranchDigestEngine(flags.newRegistry());
  const item = newGlobalBranchDigest("code-949", "label-793");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
