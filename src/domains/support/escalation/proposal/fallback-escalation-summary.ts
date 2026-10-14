import * as text from "../../../../kit/text.js";

/** Where a fallback escalation summary is in its life cycle. */
export type FallbackEscalationSummaryStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A fallback escalation summary. Its code is unique within a tenant. */
export class FallbackEscalationSummary {
  code: string;
  name: string;
  minimum: number;
  title: string;
  priority: number;
  bid: number;
  attempts: number;
  status: FallbackEscalationSummaryStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    title: string,
    priority: number,
    bid: number,
    attempts: number,
    status: FallbackEscalationSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.title = title;
    this.priority = priority;
    this.bid = bid;
    this.attempts = attempts;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: FallbackEscalationSummaryStatus): boolean {
    switch (this.status) {
      case "idle":
        return next === "ready";
      case "warming":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "ready":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackEscalationSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback escalation summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  netTotal(): number {
    return Math.round((this.priority + this.attempts) * 100) / 100;
  }

  copy(): FallbackEscalationSummary {
    return new FallbackEscalationSummary(
      this.code,
      this.name,
      this.minimum,
      this.title,
      this.priority,
      this.bid,
      this.attempts,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a fallback escalation summary in status idle. */
export function newFallbackEscalationSummary(code: string, name: string): FallbackEscalationSummary {
  return new FallbackEscalationSummary(code, name, 0, "", 0, 0, 0, "idle");
}
