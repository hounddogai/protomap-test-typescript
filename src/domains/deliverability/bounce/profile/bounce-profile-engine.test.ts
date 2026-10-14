import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceProfileEngine } from "./bounce-profile-engine.js";
import { newBounceProfile } from "./bounce-profile.js";

test("BounceProfileEngine keeps results within bounds", () => {
  const engine = defaultBounceProfileEngine(flags.newRegistry());
  const item = newBounceProfile("code-546", "label-822");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
