import * as text from "../../../../kit/text.js";

/** Where a creative template is in its life cycle. */
export type CreativeTemplateStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A creative template as the creative team keeps it. */
export class CreativeTemplate {
  code: string;
  name: string;
  currency: string;
  graceDays: number;
  retries: number;
  priority: number;
  externalRef: string;
  threshold: number;
  status: CreativeTemplateStatus;

  constructor(
    code: string,
    name: string,
    currency: string,
    graceDays: number,
    retries: number,
    priority: number,
    externalRef: string,
    threshold: number,
    status: CreativeTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.currency = currency;
    this.graceDays = graceDays;
    this.retries = retries;
    this.priority = priority;
    this.externalRef = externalRef;
    this.threshold = threshold;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeTemplateStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "reopened":
            return true;
        }
        return false;
      case "resolved":
        return next === "reopened";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CreativeTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  netExposure(): number {
    return Math.round(this.graceDays * this.priority * 100) / 100;
  }

  copy(): CreativeTemplate {
    return new CreativeTemplate(
      this.code,
      this.name,
      this.currency,
      this.graceDays,
      this.retries,
      this.priority,
      this.externalRef,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative template in status open. */
export function newCreativeTemplate(code: string, name: string): CreativeTemplate {
  return new CreativeTemplate(code, name, "", 0, 0, 0, "", 0, "open");
}
