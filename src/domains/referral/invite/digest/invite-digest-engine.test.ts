import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteDigestEngine } from "./invite-digest-engine.js";
import { newInviteDigest } from "./invite-digest.js";

test("InviteDigestEngine keeps results within bounds", () => {
  const engine = defaultInviteDigestEngine(flags.newRegistry());
  const item = newInviteDigest("code-747", "title-222");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
