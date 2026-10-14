import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingProofManifestEngine } from "./rolling-proof-manifest-engine.js";
import { newRollingProofManifest } from "./rolling-proof-manifest.js";

test("RollingProofManifestEngine keeps results within bounds", () => {
  const engine = defaultRollingProofManifestEngine(flags.newRegistry());
  const item = newRollingProofManifest("code-455", "name-541");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
