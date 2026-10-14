import * as text from "../../../../kit/text.js";

/** Where a default csat template is in its life cycle. */
export type DefaultCsatTemplateStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A default csat template as the csat team keeps it. */
export class DefaultCsatTemplate {
  code: string;
  name: string;
  openRate: number;
  budget: number;
  retries: number;
  notes: string;
  status: DefaultCsatTemplateStatus;

  constructor(
    code: string,
    name: string,
    openRate: number,
    budget: number,
    retries: number,
    notes: string,
    status: DefaultCsatTemplateStatus,
  ) {
    this.code = code;
    this.name = name;
    this.openRate = openRate;
    this.budget = budget;
    this.retries = retries;
    this.notes = notes;
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

  canMoveTo(next: DefaultCsatTemplateStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "approved" || next === "rejected";
      case "approved":
        return next === "rejected";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultCsatTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default csat template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  adjustedLoad(): number {
    return Math.round((this.openRate - this.retries) * 100) / 100;
  }

  copy(): DefaultCsatTemplate {
    return new DefaultCsatTemplate(
      this.code,
      this.name,
      this.openRate,
      this.budget,
      this.retries,
      this.notes,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a default csat template in status proposed. */
export function newDefaultCsatTemplate(code: string, name: string): DefaultCsatTemplate {
  return new DefaultCsatTemplate(code, name, 0, 0, 0, "", "proposed");
}
