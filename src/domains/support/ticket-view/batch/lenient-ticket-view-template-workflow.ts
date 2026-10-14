import * as clock from "../../../../kit/clock.js";
import {
  LenientTicketViewTemplateValidator,
  defaultLenientTicketViewTemplateValidator,
} from "./lenient-ticket-view-template-rules.js";
import { LenientTicketViewTemplateStore } from "./lenient-ticket-view-template-store.js";

/** Moves lenient ticket view templates through their life cycle and keeps a journal of what it did. */
export class LenientTicketViewTemplateDesk {
  store: LenientTicketViewTemplateStore;
  validator: LenientTicketViewTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientTicketViewTemplateStore,
    validator: LenientTicketViewTemplateValidator,
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
      throw new Error(`lenient ticket view template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient ticket view template ${code} not found`);
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
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientTicketViewTemplateDesk(store: LenientTicketViewTemplateStore, clockValue: clock.Clock): LenientTicketViewTemplateDesk {
  return new LenientTicketViewTemplateDesk(store, defaultLenientTicketViewTemplateValidator(), clockValue, []);
}
