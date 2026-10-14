import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientWindowProfileEngine } from "./lenient-window-profile-engine.js";
import { newLenientWindowProfile } from "./lenient-window-profile.js";

test("LenientWindowProfileEngine keeps results within bounds", () => {
  const engine = defaultLenientWindowProfileEngine(flags.newRegistry());
  const item = newLenientWindowProfile("code-621", "label-604");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
