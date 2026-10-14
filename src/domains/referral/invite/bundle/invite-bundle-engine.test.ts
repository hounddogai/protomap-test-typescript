import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteBundleEngine } from "./invite-bundle-engine.js";
import { newInviteBundle } from "./invite-bundle.js";

test("InviteBundleEngine keeps results within bounds", () => {
  const engine = defaultInviteBundleEngine(flags.newRegistry());
  const item = newInviteBundle("code-964", "label-517");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
