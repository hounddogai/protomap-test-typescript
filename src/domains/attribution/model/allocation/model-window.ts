import * as text from "../../../../kit/text.js";

/** Where a model window is in its life cycle. */
export type ModelWindowStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A model window. Its code is unique within a tenant. */
export class ModelWindow {
  code: string;
  name: string;
  approved: boolean;
  category: string;
  quantity: number;
  timezone: string;
  status: ModelWindowStatus;

  constructor(
    code: string,
    name: string,
    approved: boolean,
    category: string,
    quantity: number,
    timezone: string,
    status: ModelWindowStatus,
  ) {
    this.code = code;
    this.name = name;
    this.approved = approved;
    this.category = category;
    this.quantity = quantity;
    this.timezone = timezone;
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

  canMoveTo(next: ModelWindowStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "in_review";
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

  moveTo(next: ModelWindowStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model window ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model window"} ${this.code}`;
  }

  measuredValue(): number {
    return this.quantity;
  }

  copy(): ModelWindow {
    return new ModelWindow(
      this.code,
      this.name,
      this.approved,
      this.category,
      this.quantity,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a model window in status open. */
export function newModelWindow(code: string, name: string): ModelWindow {
  return new ModelWindow(code, name, false, "", 0, "", "open");
}
