import * as clock from "../../../../kit/clock.js";
import {
  ManualBranchTemplateValidator,
  defaultManualBranchTemplateValidator,
} from "./manual-branch-template-rules.js";
import { ManualBranchTemplateStore } from "./manual-branch-template-store.js";

/** Moves manual branch templates through their life cycle and keeps a journal of what it did. */
export class ManualBranchTemplateDesk {
  store: ManualBranchTemplateStore;
  validator: ManualBranchTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualBranchTemplateStore,
    validator: ManualBranchTemplateValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual branch template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual branch template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newManualBranchTemplateDesk(store: ManualBranchTemplateStore, clockValue: clock.Clock): ManualBranchTemplateDesk {
  return new ManualBranchTemplateDesk(store, defaultManualBranchTemplateValidator(), clockValue, []);
}
