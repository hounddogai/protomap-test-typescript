import * as text from "../../../../kit/text.js";

/** Where a sla template is in its life cycle. */
export type SlaTemplateStatus = "new" | "queued" | "running" | "done" | "failed";

/** A sla template as the sla team keeps it. */
export class SlaTemplate {
  code: string;
  label: string;
  amount: number;
  threshold: number;
  expiresAt: number;
  quantity: number;
  category: string;
  retries: number;
  status: SlaTemplateStatus;

  constructor(
    code: string,
    label: string,
    amount: number,
    threshold: number,
    expiresAt: number,
    quantity: number,
    category: string,
    retries: number,
    status: SlaTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.amount = amount;
    this.threshold = threshold;
    this.expiresAt = expiresAt;
    this.quantity = quantity;
    this.category = category;
    this.retries = retries;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: SlaTemplateStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "queued":
        return next === "running";
      case "running":
        switch (next) {
          case "done":
          case "failed":
            return true;
        }
        return false;
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: SlaTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  effectiveValue(): number {
    return Math.round((this.threshold + this.amount) * 100) / 100;
  }

  copy(): SlaTemplate {
    return new SlaTemplate(
      this.code,
      this.label,
      this.amount,
      this.threshold,
      this.expiresAt,
      this.quantity,
      this.category,
      this.retries,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a sla template in status new. */
export function newSlaTemplate(code: string, label: string): SlaTemplate {
  return new SlaTemplate(code, label, 0, 0, 0, 0, "", 0, "new");
}
