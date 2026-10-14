import * as text from "../../../../kit/text.js";

/** Where a funnel template is in its life cycle. */
export type FunnelTemplateStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A funnel template as the funnel team keeps it. */
export class FunnelTemplate {
  code: string;
  name: string;
  conversionRate: number;
  attempts: number;
  limit: number;
  status: FunnelTemplateStatus;

  constructor(
    code: string,
    name: string,
    conversionRate: number,
    attempts: number,
    limit: number,
    status: FunnelTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.conversionRate = conversionRate;
    this.attempts = attempts;
    this.limit = limit;
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

  canMoveTo(next: FunnelTemplateStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "ready":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "ready":
          case "draining":
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

  moveTo(next: FunnelTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"funnel template"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round(this.attempts * this.limit * 100) / 100;
  }

  copy(): FunnelTemplate {
    return new FunnelTemplate(this.code, this.name, this.conversionRate, this.attempts, this.limit, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a funnel template in status idle. */
export function newFunnelTemplate(code: string, name: string): FunnelTemplate {
  return new FunnelTemplate(code, name, 0, 0, 0, "idle");
}
