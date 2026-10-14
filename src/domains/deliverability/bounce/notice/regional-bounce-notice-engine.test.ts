import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalBounceNoticeEngine } from "./regional-bounce-notice-engine.js";
import { newRegionalBounceNotice } from "./regional-bounce-notice.js";

test("RegionalBounceNoticeEngine keeps results within bounds", () => {
  const engine = defaultRegionalBounceNoticeEngine(flags.newRegistry());
  const item = newRegionalBounceNotice("code-360", "name-135");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
