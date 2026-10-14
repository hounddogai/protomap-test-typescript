/**
 * Command socialctl runs social's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildPostMilestoneReport } from "../../domains/social/post/milestone/post-milestone-report.js";
import { newMemoryPostMilestoneStore } from "../../domains/social/post/milestone/post-milestone-store.js";
import { newPostMilestoneWorkflow } from "../../domains/social/post/milestone/post-milestone-workflow.js";
import { newPostMilestone } from "../../domains/social/post/milestone/post-milestone.js";
import { buildQueuePreferenceReport } from "../../domains/social/queue/preference/queue-preference-report.js";
import { newMemoryQueuePreferenceStore } from "../../domains/social/queue/preference/queue-preference-store.js";
import { newQueuePreferenceDesk } from "../../domains/social/queue/preference/queue-preference-workflow.js";
import { newQueuePreference } from "../../domains/social/queue/preference/queue-preference.js";
import { buildReplyForecastReport } from "../../domains/social/reply/override-item/reply-forecast-report.js";
import { newMemoryReplyForecastStore } from "../../domains/social/reply/override-item/reply-forecast-store.js";
import { newReplyForecastManager } from "../../domains/social/reply/override-item/reply-forecast-workflow.js";
import { newReplyForecast } from "../../domains/social/reply/override-item/reply-forecast.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["post-milestone", (): boolean => {
      const store = newMemoryPostMilestoneStore();
      for (let index = 0; index < 8; index++) {
        store.save(newPostMilestone(`post-milestone-${index}`, `Sample post milestone ${index}`));
      }
      const flow = newPostMilestoneWorkflow(store, clockValue, flags.newRegistry());
      try {
        flow.advance("post-milestone-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPostMilestoneReport("Post Milestone", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["reply-forecast", (): boolean => {
      const store = newMemoryReplyForecastStore();
      for (let index = 0; index < 4; index++) {
        store.save(newReplyForecast(`reply-forecast-${index}`, `Sample reply forecast ${index}`));
      }
      const flow = newReplyForecastManager(store, clockValue, flags.newRegistry());
      try {
        flow.advance("reply-forecast-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildReplyForecastReport("Reply Forecast", items, clockValue);
      console.log(report.render());
      return flow.audit(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["queue-preference", (): boolean => {
      const store = newMemoryQueuePreferenceStore();
      for (let index = 0; index < 8; index++) {
        store.save(newQueuePreference(`queue-preference-${index}`, `Sample queue preference ${index}`));
      }
      const flow = newQueuePreferenceDesk(store, clockValue);
      try {
        flow.advance("queue-preference-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildQueuePreferenceReport("Queue Preference", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
  ]);
  let failed = 0;
  for (const name of [...commands.keys()].sort()) {
    const command = commands.get(name)!;
    if (!command()) {
      console.log(`${name} failed`);
      failed += 1;
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main();
