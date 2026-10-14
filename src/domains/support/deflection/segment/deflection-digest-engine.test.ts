import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionDigestEngine } from "./deflection-digest-engine.js";
import { newDeflectionDigest } from "./deflection-digest.js";

test("DeflectionDigestEngine keeps results within bounds", () => {
  const engine = defaultDeflectionDigestEngine(flags.newRegistry());
  const item = newDeflectionDigest("code-648", "title-900");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
