import * as clock from "../../../../kit/clock.js";
import {
  PendingCreativeTemplateValidator,
  defaultPendingCreativeTemplateValidator,
} from "./pending-creative-template-rules.js";
import { PendingCreativeTemplateStore } from "./pending-creative-template-store.js";

/** Moves pending creative templates through their life cycle and keeps a journal of what it did. */
export class PendingCreativeTemplateCoordinator {
  store: PendingCreativeTemplateStore;
  validator: PendingCreativeTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingCreativeTemplateStore,
    validator: PendingCreativeTemplateValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending creative template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending creative template ${code} not found`);
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

export function newPendingCreativeTemplateCoordinator(store: PendingCreativeTemplateStore, clockValue: clock.Clock): PendingCreativeTemplateCoordinator {
  return new PendingCreativeTemplateCoordinator(store, defaultPendingCreativeTemplateValidator(), clockValue, []);
}
