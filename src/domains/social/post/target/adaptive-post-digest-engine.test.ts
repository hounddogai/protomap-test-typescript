import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePostDigestEngine } from "./adaptive-post-digest-engine.js";
import { newAdaptivePostDigest } from "./adaptive-post-digest.js";

test("AdaptivePostDigestEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePostDigestEngine(flags.newRegistry());
  const item = newAdaptivePostDigest("code-458", "name-78");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
