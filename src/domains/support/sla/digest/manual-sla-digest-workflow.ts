import * as clock from "../../../../kit/clock.js";
import { ManualSlaDigestValidator, defaultManualSlaDigestValidator } from "./manual-sla-digest-rules.js";
import { ManualSlaDigestStore } from "./manual-sla-digest-store.js";

/** Moves manual sla digests through their life cycle and keeps a journal of what it did. */
export class ManualSlaDigestService {
  store: ManualSlaDigestStore;
  validator: ManualSlaDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualSlaDigestStore,
    validator: ManualSlaDigestValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual sla digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual sla digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newManualSlaDigestService(store: ManualSlaDigestStore, clockValue: clock.Clock): ManualSlaDigestService {
  return new ManualSlaDigestService(store, defaultManualSlaDigestValidator(), clockValue, []);
}
