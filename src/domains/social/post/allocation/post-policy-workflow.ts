import * as clock from "../../../../kit/clock.js";
import { PostPolicyValidator, defaultPostPolicyValidator } from "./post-policy-rules.js";
import { PostPolicyStore } from "./post-policy-store.js";

/** Moves post policies through their life cycle and keeps a journal of what it did. */
export class PostPolicyDesk {
  store: PostPolicyStore;
  validator: PostPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: PostPolicyStore, validator: PostPolicyValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`post policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newPostPolicyDesk(store: PostPolicyStore, clockValue: clock.Clock): PostPolicyDesk {
  return new PostPolicyDesk(store, defaultPostPolicyValidator(), clockValue, []);
}
