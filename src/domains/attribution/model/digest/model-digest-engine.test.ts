import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelDigestEngine } from "./model-digest-engine.js";
import { newModelDigest } from "./model-digest.js";

test("ModelDigestEngine keeps results within bounds", () => {
  const engine = defaultModelDigestEngine(flags.newRegistry());
  const item = newModelDigest("code-753", "name-292");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
