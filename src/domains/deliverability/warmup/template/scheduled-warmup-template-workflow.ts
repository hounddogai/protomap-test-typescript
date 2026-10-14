import * as clock from "../../../../kit/clock.js";
import {
  ScheduledWarmupTemplateValidator,
  defaultScheduledWarmupTemplateValidator,
} from "./scheduled-warmup-template-rules.js";
import { ScheduledWarmupTemplateStore } from "./scheduled-warmup-template-store.js";

/** Moves scheduled warmup templates through their life cycle and keeps a journal of what it did. */
export class ScheduledWarmupTemplateWorkflow {
  store: ScheduledWarmupTemplateStore;
  validator: ScheduledWarmupTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledWarmupTemplateStore,
    validator: ScheduledWarmupTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled warmup template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled warmup template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledWarmupTemplateWorkflow(store: ScheduledWarmupTemplateStore, clockValue: clock.Clock): ScheduledWarmupTemplateWorkflow {
  return new ScheduledWarmupTemplateWorkflow(store, defaultScheduledWarmupTemplateValidator(), clockValue, []);
}
