import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledActivationDigestEngine } from "./scheduled-activation-digest-engine.js";
import { newScheduledActivationDigest } from "./scheduled-activation-digest.js";

test("ScheduledActivationDigestEngine keeps results within bounds", () => {
  const engine = defaultScheduledActivationDigestEngine(flags.newRegistry());
  const item = newScheduledActivationDigest("code-634", "name-428");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
