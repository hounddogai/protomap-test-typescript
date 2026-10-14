import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyProfileEngine } from "./reply-profile-engine.js";
import { newReplyProfile } from "./reply-profile.js";

test("ReplyProfileEngine keeps results within bounds", () => {
  const engine = defaultReplyProfileEngine(flags.newRegistry());
  const item = newReplyProfile("code-32", "name-141");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
