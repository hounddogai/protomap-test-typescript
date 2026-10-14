import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveMentionCycleValidator,
  defaultAdaptiveMentionCycleValidator,
} from "./adaptive-mention-cycle-rules.js";
import { AdaptiveMentionCycleStore } from "./adaptive-mention-cycle-store.js";

/** Moves adaptive mention cycles through their life cycle and keeps a journal of what it did. */
export class AdaptiveMentionCycleService {
  store: AdaptiveMentionCycleStore;
  validator: AdaptiveMentionCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveMentionCycleStore,
    validator: AdaptiveMentionCycleValidator,
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
      throw new Error(`adaptive mention cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive mention cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newAdaptiveMentionCycleService(store: AdaptiveMentionCycleStore, clockValue: clock.Clock): AdaptiveMentionCycleService {
  return new AdaptiveMentionCycleService(store, defaultAdaptiveMentionCycleValidator(), clockValue, []);
}
