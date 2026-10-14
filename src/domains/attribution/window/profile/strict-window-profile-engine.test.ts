import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictWindowProfileEngine } from "./strict-window-profile-engine.js";
import { newStrictWindowProfile } from "./strict-window-profile.js";

test("StrictWindowProfileEngine keeps results within bounds", () => {
  const engine = defaultStrictWindowProfileEngine(flags.newRegistry());
  const item = newStrictWindowProfile("code-486", "name-1");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
