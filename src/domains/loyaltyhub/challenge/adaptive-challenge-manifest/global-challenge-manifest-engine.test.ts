import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalChallengeManifestEngine } from "./global-challenge-manifest-engine.js";
import { newGlobalChallengeManifest } from "./global-challenge-manifest.js";

test("GlobalChallengeManifestEngine keeps results within bounds", () => {
  const engine = defaultGlobalChallengeManifestEngine(flags.newRegistry());
  const item = newGlobalChallengeManifest("code-475", "label-902");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
