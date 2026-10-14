import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveInviteScheduleEngine,
  defaultAdaptiveInviteScheduleEngine,
} from "./adaptive-invite-schedule-engine.js";
import {
  AdaptiveInviteScheduleValidator,
  defaultAdaptiveInviteScheduleValidator,
} from "./adaptive-invite-schedule-rules.js";
import { AdaptiveInviteScheduleStore } from "./adaptive-invite-schedule-store.js";

/** Moves adaptive invite schedules through their life cycle and keeps a journal of what it did. */
export class AdaptiveInviteScheduleDesk {
  store: AdaptiveInviteScheduleStore;
  validator: AdaptiveInviteScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveInviteScheduleEngine;

  constructor(
    store: AdaptiveInviteScheduleStore,
    validator: AdaptiveInviteScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveInviteScheduleEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive invite schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive invite schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive invite schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newAdaptiveInviteScheduleDesk(store: AdaptiveInviteScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveInviteScheduleDesk {
  return new AdaptiveInviteScheduleDesk(
    store,
    defaultAdaptiveInviteScheduleValidator(),
    clockValue,
    [],
    defaultAdaptiveInviteScheduleEngine(flagsValue),
  );
}
