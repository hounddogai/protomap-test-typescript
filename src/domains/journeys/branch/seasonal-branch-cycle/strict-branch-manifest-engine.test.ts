import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictBranchManifestEngine } from "./strict-branch-manifest-engine.js";
import { newStrictBranchManifest } from "./strict-branch-manifest.js";

test("StrictBranchManifestEngine keeps results within bounds", () => {
  const engine = defaultStrictBranchManifestEngine(flags.newRegistry());
  const item = newStrictBranchManifest("code-418", "name-819");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
