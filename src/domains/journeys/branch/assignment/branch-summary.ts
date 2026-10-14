import * as text from "../../../../kit/text.js";

/** Where a branch summary is in its life cycle. */
export type BranchSummaryStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A branch summary. Its code is unique within a tenant. */
export class BranchSummary {
  code: string;
  name: string;
  quantity: number;
  label: string;
  ratio: number;
  locale: string;
  sendAt: number;
  unit: string;
  status: BranchSummaryStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    label: string,
    ratio: number,
    locale: string,
    sendAt: number,
    unit: string,
    status: BranchSummaryStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.label = label;
    this.ratio = ratio;
    this.locale = locale;
    this.sendAt = sendAt;
    this.unit = unit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: BranchSummaryStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "completed";
      case "scheduled":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: BranchSummaryStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`branch summary ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.name})`;
  }

  projectedValue(): number {
    return Math.round((this.sendAt - this.ratio) * 100) / 100;
  }

  copy(): BranchSummary {
    return new BranchSummary(
      this.code,
      this.name,
      this.quantity,
      this.label,
      this.ratio,
      this.locale,
      this.sendAt,
      this.unit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a branch summary in status planned. */
export function newBranchSummary(code: string, name: string): BranchSummary {
  return new BranchSummary(code, name, 0, "", 0, "", 0, "", "planned");
}
