import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryChallengeManifestEngine } from "./primary-challenge-manifest-engine.js";
import { newPrimaryChallengeManifest } from "./primary-challenge-manifest.js";

test("PrimaryChallengeManifestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryChallengeManifestEngine();
  const item = newPrimaryChallengeManifest("code-632", "name-856");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
