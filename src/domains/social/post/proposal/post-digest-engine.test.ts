import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostDigestEngine } from "./post-digest-engine.js";
import { newPostDigest } from "./post-digest.js";

test("PostDigestEngine keeps results within bounds", () => {
  const engine = defaultPostDigestEngine();
  const item = newPostDigest("code-169", "name-230");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
