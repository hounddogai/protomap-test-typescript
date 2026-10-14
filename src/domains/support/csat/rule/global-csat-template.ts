import * as text from "../../../../kit/text.js";

/** Where a global csat template is in its life cycle. */
export type GlobalCsatTemplateStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A global csat template. Its code is unique within a tenant. */
export class GlobalCsatTemplate {
  code: string;
  label: string;
  cohort: string;
  category: string;
  revision: number;
  timezone: string;
  capacity: number;
  campaignRef: string;
  quantity: number;
  status: GlobalCsatTemplateStatus;

  constructor(
    code: string,
    label: string,
    cohort: string,
    category: string,
    revision: number,
    timezone: string,
    capacity: number,
    campaignRef: string,
    quantity: number,
    status: GlobalCsatTemplateStatus,
  ) {
    this.code = code;
    this.label = label;
    this.cohort = cohort;
    this.category = category;
    this.revision = revision;
    this.timezone = timezone;
    this.capacity = capacity;
    this.campaignRef = campaignRef;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalCsatTemplateStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "active":
            return true;
        }
        return false;
      case "pending":
        return next === "active";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: GlobalCsatTemplateStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global csat template ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${"global csat template"} ${this.code}`;
  }

  projectedLoad(): number {
    return Math.round((this.capacity - this.revision) * 100) / 100;
  }

  copy(): GlobalCsatTemplate {
    return new GlobalCsatTemplate(
      this.code,
      this.label,
      this.cohort,
      this.category,
      this.revision,
      this.timezone,
      this.capacity,
      this.campaignRef,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a global csat template in status draft. */
export function newGlobalCsatTemplate(code: string, label: string): GlobalCsatTemplate {
  return new GlobalCsatTemplate(code, label, "", "", 0, "", 0, "", 0, "draft");
}
