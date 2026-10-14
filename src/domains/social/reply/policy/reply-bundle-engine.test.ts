import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyBundleEngine } from "./reply-bundle-engine.js";
import { newReplyBundle } from "./reply-bundle.js";

test("ReplyBundleEngine keeps results within bounds", () => {
  const engine = defaultReplyBundleEngine(flags.newRegistry());
  const item = newReplyBundle("code-432", "label-143");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
