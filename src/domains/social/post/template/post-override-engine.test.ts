import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostOverrideEngine } from "./post-override-engine.js";
import { newPostOverride } from "./post-override.js";

test("PostOverrideEngine keeps results within bounds", () => {
  const engine = defaultPostOverrideEngine();
  const item = newPostOverride("code-844", "title-920");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
