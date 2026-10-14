import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostProfileEngine } from "./post-profile-engine.js";
import { newPostProfile } from "./post-profile.js";

test("PostProfileEngine keeps results within bounds", () => {
  const engine = defaultPostProfileEngine(flags.newRegistry());
  const item = newPostProfile("code-28", "label-594");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
