import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedWaitProfileEngine } from "./capped-wait-profile-engine.js";
import { newCappedWaitProfile } from "./capped-wait-profile.js";

test("CappedWaitProfileEngine keeps results within bounds", () => {
  const engine = defaultCappedWaitProfileEngine(flags.newRegistry());
  const item = newCappedWaitProfile("code-857", "name-220");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
