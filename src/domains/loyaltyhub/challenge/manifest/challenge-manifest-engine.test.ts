import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeManifestEngine } from "./challenge-manifest-engine.js";
import { newChallengeManifest } from "./challenge-manifest.js";

test("ChallengeManifestEngine keeps results within bounds", () => {
  const engine = defaultChallengeManifestEngine(flags.newRegistry());
  const item = newChallengeManifest("code-426", "title-345");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
