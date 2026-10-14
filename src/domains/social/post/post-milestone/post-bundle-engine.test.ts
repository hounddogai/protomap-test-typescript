import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostBundleEngine } from "./post-bundle-engine.js";
import { newPostBundle } from "./post-bundle.js";

test("PostBundleEngine keeps results within bounds", () => {
  const engine = defaultPostBundleEngine(flags.newRegistry());
  const item = newPostBundle("code-520", "name-252");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
