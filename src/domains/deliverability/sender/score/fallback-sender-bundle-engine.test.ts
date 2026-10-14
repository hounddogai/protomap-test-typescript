import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSenderBundleEngine } from "./fallback-sender-bundle-engine.js";
import { newFallbackSenderBundle } from "./fallback-sender-bundle.js";

test("FallbackSenderBundleEngine keeps results within bounds", () => {
  const engine = defaultFallbackSenderBundleEngine(flags.newRegistry());
  const item = newFallbackSenderBundle("code-57", "title-340");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
