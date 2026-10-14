import * as clock from "../../../../kit/clock.js";
import {
  GlobalRedemptionGroupValidator,
  defaultGlobalRedemptionGroupValidator,
} from "./global-redemption-group-rules.js";
import { GlobalRedemptionGroupStore } from "./global-redemption-group-store.js";

/** Moves global redemption groups through their life cycle and keeps a journal of what it did. */
export class GlobalRedemptionGroupService {
  store: GlobalRedemptionGroupStore;
  validator: GlobalRedemptionGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalRedemptionGroupStore,
    validator: GlobalRedemptionGroupValidator,
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
      throw new Error(`global redemption group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global redemption group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newGlobalRedemptionGroupService(store: GlobalRedemptionGroupStore, clockValue: clock.Clock): GlobalRedemptionGroupService {
  return new GlobalRedemptionGroupService(store, defaultGlobalRedemptionGroupValidator(), clockValue, []);
}
