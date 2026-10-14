import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelDigestEngine } from "./level-digest-engine.js";
import { newLevelDigest } from "./level-digest.js";

test("LevelDigestEngine keeps results within bounds", () => {
  const engine = defaultLevelDigestEngine(flags.newRegistry());
  const item = newLevelDigest("code-679", "label-785");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
