import * as text from "../../../../kit/text.js";

/** Where a adaptive sender template is in its life cycle. */
export type AdaptiveSenderTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A adaptive sender template. Its code is unique within a tenant. */
export class AdaptiveSenderTemplate {
  code: string;
  label: string;
  budget: number;
  attempts: number;
  sendAt: number;
  status: AdaptiveSenderTemplateStatus;

  constructor(
    code: string,
    label: string,
    budget: number,
    attempts: number,
    sendAt: number,
    status: AdaptiveSenderTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.budget = budget;
    this.attempts = attempts;
    this.sendAt = sendAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: AdaptiveSenderTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "approved":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: AdaptiveSenderTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`adaptive sender template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"adaptive sender template"} ${this.code}`;
  }

  projectedExposure(): number {
    return Math.round(this.attempts * this.budget * 100) / 100;
  }

  copy(): AdaptiveSenderTemplate {
    return new AdaptiveSenderTemplate(this.code, this.label, this.budget, this.attempts, this.sendAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a adaptive sender template in status proposed. */
export function newAdaptiveSenderTemplate(code: string, label: string): AdaptiveSenderTemplate {
  return new AdaptiveSenderTemplate(code, label, 0, 0, 0, "proposed");
}
